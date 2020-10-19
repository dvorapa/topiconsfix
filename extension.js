
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const NotificationDaemon = imports.ui.notificationDaemon;

let trayManager = null;
let trayAddedId = 0;
let trayRemovedId = 0;
let getSource = null;
let icons = [];

function init() {
    getSource = Lang.bind(Main.notificationDaemon, NotificationDaemon.NotificationDaemon.prototype._getSource);
}

function enable() {
    trayManager = new Shell.TrayManager();
    trayAddedId = trayManager.connect('tray-icon-added', onTrayIconAdded);
    trayRemovedId = trayManager.connect('tray-icon-removed', onTrayIconRemoved);
    trayManager.manage_stage(global.stage, Main.panel._rightBox);

    Main.notificationDaemon._getSource = createSource;

    for (let i = 0; i < Main.notificationDaemon._sources.length; i++) {
        let source = Main.notificationDaemon._sources[i];
        if (!source.trayIcon)
            continue;
        let parent = source.trayIcon.get_parent();
        parent.remove_actor(source.trayIcon);
        onTrayIconAdded(this, source.trayIcon, source.initialTitle);
        source.destroy();
    }
}

function createSource (title, pid, ndata, sender, trayIcon) { 
  if (trayIcon) {
    onTrayIconAdded(this, trayIcon, title);
    return null;
  }

  return getSource(title, pid, ndata, sender, trayIcon);
};

function onTrayIconAdded(o, icon, role) {
    let buttonBox = new PanelMenu.ButtonBox();
    let box = buttonBox.actor;
    let parent = box.get_parent();

    icon.height = 24;
    box.add_actor(icon);

    if (parent)
        parent.remove_actor(box);

    icons.push(icon);
    Main.panel._rightBox.insert_child_at_index(box, 0);
}

function onTrayIconRemoved(o, icon) {
    let parent = icon.get_parent();
    parent.destroy();
    icon.destroy();
    icons.splice(icons.indexOf(icon), 1);
}

function disable() {
    if (trayAddedId != 0) {
        trayManager.disconnect(trayAddedId);
        trayAddedId = 0;
    }

    if (trayRemovedId != 0) {
        trayManager.disconnect(trayRemovedId);
        trayRemovedId = 0;
    }

    Main.notificationDaemon._getSource = getSource;
    trayManager = null;

    for (let i = 0; i < icons.length; i++) {
        let icon = icons[i];
        let parent = icon.get_parent();
        parent.remove_actor(icon);
        parent.destroy();
        Main.notificationDaemon._onTrayIconAdded(Main.notificationDaemon, icon);
    }
    
    icons = [];
}
