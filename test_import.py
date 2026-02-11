try:
    from main import app
    print("FastAPI app import successful")
except Exception as e:
    print(f"FastAPI app import failed: {e}")
    import sys
    sys.exit(1)