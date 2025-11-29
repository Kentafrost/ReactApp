import gspread
import pickle
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import os, logging, time
import json
import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter
import ssl
import urllib3

# Global SSL and certificate verification disable
import ssl
import certifi
import os
os.environ['CURL_CA_BUNDLE'] = ""
os.environ['REQUESTS_CA_BUNDLE'] = ""
ssl._create_default_https_context = ssl._create_unverified_context

# Disable urllib3 warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Monkey patch requests to disable SSL verification globally
original_request = requests.Session.request
def patched_request(self, *args, **kwargs):
    kwargs['verify'] = False
    return original_request(self, *args, **kwargs)
requests.Session.request = patched_request

with open("google_auth_credential.json", "r") as f:
    secret_path = json.load(f)

base_path = secret_path[0]["gdrive_credentials"]


# Function to authenticate and return Google Drive service
def gdrive_authenticate():

    current_dir = os.path.dirname(os.path.abspath(__file__))
    SCOPES = ['https://www.googleapis.com/auth/drive']

    # Load Google Drive credentials path
    with open(os.path.join(current_dir, "google_auth_credential.json"), "r") as f:
        auth_credential = json.load(f)
        gdrive_credentials_path = auth_credential[0]['gdrive_credentials'] + "/gdrive_credentials.json"

    token_path = os.path.join(current_dir, "token", "token_gdrive.json")
    os.makedirs(os.path.dirname(token_path), exist_ok=True)

    from google.oauth2.credentials import Credentials

    if os.path.exists(token_path) and os.path.getsize(token_path) > 0:
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    else:
        # Google Drive API Authentication
        for attempt in range(3):
            try:
                flow = InstalledAppFlow.from_client_secrets_file(gdrive_credentials_path, SCOPES)
                creds = flow.run_local_server(port=0)
                print("Google Drive API Authorization successful.")
                logging.info("Google Drive API Authorization successful.")
                time.sleep(2)

                # save the credentials for the next run to shorten the login process
                with open(token_path, 'w') as token:
                    token.write(creds.to_json())
                    break
            except Exception as e:
                logging.error(f"Google Drive API Authorization error: {e}")
                print(f"Google Drive API Authorization error: {e}")
                time.sleep(5)
        else:
            logging.critical("Google Drive API Authorization failed for 3 times. Exiting the program.")
            print("Google Drive API Authorization failed for 3 times. Exiting the program.")
            os._exit(1)
                
    gdrive_service = build('drive', 'v3', credentials=creds)
    return gdrive_service


# Function to authorize Gmail API and return service
def authorize_gmail():

    gmail_cred = os.path.join(base_path, "OAuth_credentials.json")

    try:
        scope = secret_path[0]["mail_scope"]

        creds = None
        token_file = os.path.join(base_path, "token.pickle")

        # Load existing credentials if available
        if os.path.exists(token_file):
            with open(token_file, "rb") as token:
                creds = pickle.load(token)

        # If there are no (valid) credentials available, let the user log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                logging.info("Refreshing expired credentials.")
                creds.refresh(Request())
            else:
                logging.info("No existing token found, starting new authentication flow.")
                flow = InstalledAppFlow.from_client_secrets_file(gmail_cred, scope)
                creds = flow.run_local_server(port=0)
            
            # Save credentials for future use
            with open(token_file, "wb") as token:
                pickle.dump(creds, token)
        
        gmail_service = build('gmail', 'v1', credentials=creds)
        logging.info("Gmail service authorized successfully.")
        
        return gmail_service
            
    except Exception as e:
        logging.error('Google Authorization Error')
        print(f"Error: {e}")
        os._exit(1)

# google spreadsheet authorization
def authorize_gsheet():
    gsheet_cred = os.path.join(base_path, "gsheet_credentials.json")

    try:
        scope = secret_path[2]["sheet_scope"]
        
        credentials = Credentials.from_service_account_file(
            gsheet_cred, scopes=scope
        )
        
        # Create a custom session with more aggressive SSL and retry settings
        # Disable SSL verification temporarily (for testing only)
        session = requests.Session()
        session.verify = False
        
        # Disable SSL warnings
        import urllib3
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        # Set up more aggressive retry strategy
        retry_strategy = Retry(
            total=10,
            backoff_factor=3,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST"],
            raise_on_status=False
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        
        # Set longer timeouts
        session.timeout = 30
        
        # Create request object with custom session
        from google.auth.transport.requests import Request
        auth_request = Request(session)
        
        # Add multiple retry attempts with delays
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                credentials.refresh(auth_request)
                break
            except Exception as retry_error:
                if attempt == max_attempts - 1:
                    raise retry_error
                print(f"Authentication attempt {attempt + 1} failed, retrying in {5 * (attempt + 1)} seconds...")
                time.sleep(5 * (attempt + 1))
        
        # Create gspread client with custom HTTP client settings
        import gspread.http_client
        
        # Monkey patch the gspread HTTPClient to use our custom session
        original_init = gspread.http_client.HTTPClient.__init__
        def patched_init(self, *args, **kwargs):
            original_init(self, *args, **kwargs)
            self.session.verify = False
            
            # Apply the same retry strategy
            retry_strategy = Retry(
                total=10,
                backoff_factor=3,
                status_forcelist=[429, 500, 502, 503, 504],
                allowed_methods=["HEAD", "GET", "OPTIONS", "POST"],
                raise_on_status=False
            )
            adapter = HTTPAdapter(max_retries=retry_strategy)
            self.session.mount("https://", adapter)
            self.session.mount("http://", adapter)
            self.session.timeout = 30
            
        gspread.http_client.HTTPClient.__init__ = patched_init
        
        # Authorize the gspread client with refreshed credentials
        gspread_client = gspread.authorize(credentials)
        logging.info("Google Sheets service authorized successfully.")

        return gspread_client

    except Exception as e:
        logging.error('Google Authorization Error')
        print(f"Error: {e}")
        print("Network issue or Google service issue detected.")
        print("Please wait a few seconds and try again.")
        os._exit(1)