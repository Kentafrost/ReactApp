import os
import win32com.client
import time
import logging
logging.basicConfig(level=logging.INFO)

# current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
current_time = time.strftime("%Y%m%d_%H%M%S")
current_day_zero = time.strftime("%Y-%m-%dT00:00:00", time.localtime())

# connect to the task scheduler
scheduler = win32com.client.Dispatch('Schedule.Service')
scheduler.Connect()

root_folder = scheduler.GetFolder('\\')
tasks = root_folder.GetTasks(0)

current_tasks_names = [task.Name for task in tasks]
current_tasks_status = {task.Enabled for task in tasks}


# function to enable or disable task scheduler
def enable_disable_task_scheduler(tasks_name, check):
    
    try:
        task = root_folder.GetTask(tasks_name)
        logging.info(f"Target Task: {task}")

        if check == 'enable':
            task.Enabled = True
            root_folder.RegisterTaskDefinition(
                tasks_name, 
                task.Definition, 
                6, 
                None, 
                None, 
                3, 
                None
            )
            logging.info(f"Enabled Task: '{tasks_name}'")

        elif check == 'disable':            
            task.Enabled = False
            root_folder.RegisterTaskDefinition(
                tasks_name, 
                task.Definition, 
                6, 
                None, 
                None, 
                3, 
                None
            )
            logging.info(f"Disabled Task: '{tasks_name}'")

        return {
            "status": "success", 
            "message": f"Task '{tasks_name}' {check}d."
        }

    except Exception as e:
        logging.error(f"Error occurred while trying to {check} task '{tasks_name}': {e}")
        return {
            "status": "failed", 
            "message": str(e)
        }

current_day = time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime())

# select enable or disable task scheduler from selected task path on GUI
def task_enable_disable(task_name, check):

    try:
        if check == "disable":
            enable_disable_task_scheduler(task_name, "disable")
            msg = f"Task '{task_name}' disabled."
        elif check == "enable":
            enable_disable_task_scheduler(task_name, "enable")
            msg = f"Task '{task_name}' enabled."

    except Exception as e:
        logging.error(f"Error occurred while trying to {check} task '{task_name}': {e}")
        return {"status": "failed", "message": str(e)}
    
    logging.info("Task scheduler switch operation completed.")
    ()
    return {
        "status": "success", 
        "message": msg,
        "task_name": task_name
    }


# list up all task schedulers(name and enabled status)
def task_listup():
    return [{"name": task.Name, "enabled": task.Enabled} for task in tasks]


# create shutdown task scheduler if not exist
def task_shutdown(timespan):

    action_path = rf"C:\\Windows\\System32\\shutdown.exe -s -t {timespan}"
    weekdays_task = "PCShutdownTaskWeekdays"
    weekends_task = "PCShutdownTaskWeekends"

    # Create task scheduler(weekdays) if not exist
    if not weekdays_task in current_tasks_names:
        print(f"Task '{weekdays_task}' doesn't exist.")
        print("Creating task scheduler for weekdays...")

        weekdays_task_def = scheduler.NewTask(0)
        weekdays_task_def.RegistrationInfo.Description = "PC Shutdown Task."

        weekdays_task_def.Actions.Create(0).Path = action_path
        weekdays_task_def.Settings.Enabled = True
        weekdays_task_def.Settings.StopIfGoingOnBatteries = False
        
        weekdays_trigger = weekdays_task_def.Triggers.Create(2)  # 2: daily trigger
        weekdays_trigger.StartBoundary = current_day_zero # Set start time to today at 00:00:00

        print(f"Task '{weekdays_task}' doesn't exist.")
        weekdays_trigger.DaysOfWeek = 62  # 62: Monday to Friday (binary 111110)
        
        root_folder.RegisterTaskDefinition(
            weekdays_task,
            weekdays_task_def,
            6,  # create or update
            "", "",  # run as current user
            3  # logon type: interactive
        )
        logging.info(f"Shutdown task scheduler({weekdays_task}) creation operation completed.")

        
    # Create task scheduler(weekends) if not exist
    if not weekends_task in current_tasks_names:
        print(f"Task '{weekends_task}' doesn't exist.")
        print("Creating task scheduler for weekends...")

        weekends_task_def = scheduler.NewTask(0)
        weekends_task_def.RegistrationInfo.Description = "PC Shutdown Task."

        weekends_task_def.Actions.Create(0).Path = action_path
        weekends_task_def.Settings.Enabled = True
        weekends_task_def.Settings.StopIfGoingOnBatteries = False
        
        weekends_trigger = weekends_task_def.Triggers.Create(2)  # 2: daily trigger
        weekends_trigger.StartBoundary = current_day_zero # Set start time to today at 00:00:00
        
        weekends_trigger.DaysOfWeek = 65  # 65: Saturday and Sunday (binary 1000001)

        root_folder.RegisterTaskDefinition(
            weekends_task,
            weekends_task_def,
            6,  # create or update
            "", "",  # run as current user
            3  # logon type: interactive
        )
        logging.info("Shutdown task scheduler creation operation completed.")
    else:
        return {"status": "failed", "message": f"Task '{weekends_task}' already exists."}

    return {
        "status": "success", 
        "message": f"Shutdown task scheduler({weekends_task} & {weekdays_task}) creation operation completed."
    }


# create task scheduler for selected script file
def task_create(task_name, date, time, timespan, command, file_path):
    file_name = os.path.basename(file_path)

    # Create task scheduler if not exist
    if task_name not in current_tasks_names:
        task_def = scheduler.NewTask(0)
        task_def.RegistrationInfo.Description = f"Task scheduler to run a script file [{file_name}]"
        
        script_path = file_path

        task_def.Actions.Create(0).Path = script_path
        task_def.Settings.Enabled = True
        task_def.Settings.StopIfGoingOnBatteries = False

        # Task def
        trigger = task_def.Triggers.Create(2)  # 2: daily trigger
        trigger.StartBoundary = current_day
        trigger.DaysInterval = 1  # 毎日

        root_folder.RegisterTaskDefinition(
            task_name,
            task_def,
            6,  # create or update
            "", 
            "",
            3  # logon type: interactive
        )

        logging.info("Task Schedules creation completed")
        
        os.system("taskschd.msc")
        return {
            "status": "success", 
            "message": "Task Schedules creation completed."
        }
    
    else:
        logging.info(f"This task schedule already exists. Script name: {file_name}")
        
        return {
            "status": "failed", 
            "message": f"This task schedule already exists. Script name: {file_name}"
        }
