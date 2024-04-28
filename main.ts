import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface FontawesomePluginSettings {
	enabledJsFiles: Record<string, boolean>;
}

const DEFAULT_SETTINGS: FontawesomePluginSettings = {
	enabledJsFiles: { "fontawesome.js": true },
};

class FontawesomePluginSettingTab extends PluginSettingTab {
	plugin: FontawesomePlugin;

	constructor(app: App, plugin: FontawesomePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl, plugin } = this;
		containerEl.empty();

		plugin.app.vault.adapter.list(plugin.jsDirPath).then((fileList) => {
			for (const file of fileList.files) {
				const name = file.split("/").at(-1) as string;
				const nameWithoutExtension = name.slice(
					0,
					name.lastIndexOf(".")
				);
				new Setting(containerEl)
					.setName(nameWithoutExtension)
					.setDesc("Enable this file")
					.addToggle((cb) => {
						cb.setValue(
							name in plugin.settings.enabledJsFiles
						).onChange((newValue) => {
							if (newValue) {
								plugin.settings.enabledJsFiles[name] = true;
							} else {
								delete plugin.settings.enabledJsFiles[name];
							}
							plugin.saveSettings();
							if (newValue) {
								plugin.executeJsFile(name);
							}
						});
					});
			}
		});
	}
}

export default class FontawesomePlugin extends Plugin {
	settings: FontawesomePluginSettings;
	jsDirPath: string;

	async onload() {
		await this.loadSettings();
		this.jsDirPath = `${this.app.vault.configDir}/plugins/obsidian-fontawesome/fontawesome/js`;

		for (const file in this.settings.enabledJsFiles) {
			if (file !== "fontawesome.js") {
				this.executeJsFile(file);
			}
		}
		if ("fontawesome.js" in this.settings.enabledJsFiles) {
			this.executeJsFile("fontawesome.js");
		}

		this.addSettingTab(new FontawesomePluginSettingTab(this.app, this));
	}

	async executeJsFile(fileName: string) {
		const fullPath = `${this.jsDirPath}/${fileName}`;
		if (await this.app.vault.adapter.exists(fullPath)) {
			const source = await this.app.vault.adapter.read(fullPath);
			Function(source)();
		} else {
			console.error(`File ${fileName} not found`);
		}
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
