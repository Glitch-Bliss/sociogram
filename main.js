
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
//https://electron.guide/electron-alert/
const Alert = require("electron-alert");

function createWindow() {

    var image = __dirname + '/assets/app-icon.png';

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1500,
        height: 1200,
        show: true,
        icon: image,
        autoHideMenuBar: true,
        webPreferences: {
            devTools: true,
            enableRemoteModule: true,
            preload: path.join(__dirname, 'preload_main.js'),
        }
    })
    mainWindow.loadFile('index.html');
}

ipcMain.handle('alert:message', async (_, args) => {
    let alert = new Alert();
    let swalOptions = {
        position: "center",
        title: args.message,
        icon: args.icon,
        showConfirmButton: true,
        timer: 10000,
        timerProgressBar: true
    };
    Alert.fireToast(swalOptions);
});

ipcMain.handle('dialog:open', async (_, args) => {
    return await dialog.showOpenDialog({
        buttonLabel: 'Ouvrir',
        filters: [{ name: 'Fichiers Sociographers', extensions: ['sociographer'] }],
        property: ['openFile']
    });
});

ipcMain.handle('dialog:message', async (_, args) => {
    dialog.showMessageBox(args, (index) => { });
});

ipcMain.handle('dialog:save', async (_, args) => {
    return await dialog.showSaveDialog({
        buttonLabel: 'Sauvegarder',
        filters: [{ name: 'Fichier Sociographer', extensions: ['sociographer'] }],
        property: ['createDirectory', 'showOverwriteConfirmation']
    });
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them her