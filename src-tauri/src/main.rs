// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod python_bridge;

use commands::*;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            parse_pdf,
            process_video,
            process_audio,
            execute_command,
            get_resources,
            get_resource_by_id,
            save_resource,
            delete_resource,
            get_settings,
            update_settings,
            get_task_status,
            list_tasks
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


