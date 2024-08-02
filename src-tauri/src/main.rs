// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, SystemTray};
use tauri_plugin_positioner::{Position, WindowExt};
use window_vibrancy::apply_mica;

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

fn main() {
    let tray = SystemTray::new().with_tooltip("Upload Widget App");

    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .system_tray(tray)
        .setup(|app| {
            let window = app.get_window("main").unwrap();

            #[cfg(target_os = "windows")]
            apply_mica(window, Some(true))
                .expect("Unsupported platform! 'apply_mica' is only supported on Windows");

            Ok(())
        })
        .on_system_tray_event(|app, event| {
            tauri_plugin_positioner::on_tray_event(app, &event);
            match event {
                tauri::SystemTrayEvent::LeftClick { .. } => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                }
                tauri::SystemTrayEvent::RightClick { .. } => {
                    println!("Right click");
                    let window = app.get_window("main").unwrap();

                    let _ = window.move_window(Position::TrayCenter);
                    if window.is_visible().unwrap() {
                        window.hide().unwrap();
                    } else {
                        window.show().unwrap();
                    }
                }
                tauri::SystemTrayEvent::DoubleClick { .. } => {
                    println!("Double click");
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![quit_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
