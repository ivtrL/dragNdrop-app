// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{BufRead, BufReader};

use serde::Serialize;
use tauri::{tray, Emitter, Manager};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_positioner::{Position, WindowExt};
#[cfg(target_os = "windows")]
use window_vibrancy::apply_blur;
#[cfg(target_os = "macos")]
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DroppedFile<'a> {
    path: String,
    x: f64,
    y: f64,
    buffer: Vec<&'a [u8]>,
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

fn drop_files(
    app: &tauri::AppHandle,
    path: &std::path::PathBuf,
    position: &tauri::PhysicalPosition<f64>,
) {
    let mut out = BufReader::new(std::fs::File::open(path).unwrap());
    let buffer = vec![out.fill_buf().unwrap()];
    app.emit(
        "drop-files",
        DroppedFile {
            path: String::from(path.to_str().unwrap()),
            x: position.x,
            y: position.y,
            buffer,
        },
    )
    .unwrap();
}

fn match_tray_events(app: &tauri::AppHandle, event: &tray::TrayIconEvent) {
    match event {
        tray::TrayIconEvent::Click {
            button,
            button_state,
            ..
        } => {
            if button_state == &tray::MouseButtonState::Down {
                match button {
                    _ => {
                        let window = app.get_webview_window("main").unwrap();
                        window.move_window(Position::TrayCenter).unwrap();
                        if window.is_visible().unwrap() {
                            window.hide().unwrap();
                        } else {
                            window.show().unwrap();
                        }
                    }
                }
            }
        }
        tray::TrayIconEvent::Enter { .. } => {}
        _ => {}
    }
}

fn show_window(app: &tauri::AppHandle) {
    let windows = app.webview_windows();

    windows
        .values()
        .next()
        .expect("Sorry, no window found")
        .set_focus()
        .expect("Can't Bring Window to Focus");
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            let _ = show_window(app);
        }))
        .setup(|app| {
            app.on_tray_icon_event(|app, event| {
                tauri_plugin_positioner::on_tray_event(app, &event);
                match_tray_events(app, &event);
            });

            let windows = app.webview_windows();

            for window in windows.values() {
                #[cfg(target_os = "macos")]
                apply_vibrancy(
                    window,
                    NSVisualEffectMaterial::Menu,
                    Some(NSVisualEffectState::Active),
                    None,
                )
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on MacOS");

                #[cfg(target_os = "windows")]
                apply_blur(window, Some((120, 120, 120, 20)))
                    .expect("Unsupported platform! 'apply_mica' is only supported on Windows");
            }

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::DragDrop(drag_drop_event) => match drag_drop_event {
                tauri::DragDropEvent::Drop { paths, position } => {
                    let app = window.app_handle();
                    for path in paths {
                        drop_files(app, path, position);
                    }
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![quit_app])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
