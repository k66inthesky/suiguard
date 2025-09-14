import { readFileSync } from "node:fs";
const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));
/**
 * @prop default_locale
 * if you want to support multiple languages, you can use the following reference
 * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Internationalization
 *
 * @prop browser_specific_settings
 * Must be unique to your extension to upload to addons.mozilla.org
 * (you can delete if you only want a chrome extension)
 *
 * @prop permissions
 * Firefox doesn't support sidePanel (It will be deleted in manifest parser)
 *
 * @prop content_scripts
 * css: ['content.css'], // public folder
 */
const manifest = {
    manifest_version: 3,
    default_locale: "zh_TW",
    name: "__MSG_extensionName__",
    browser_specific_settings: {
        gecko: {
            id: "example@example.com",
            strict_min_version: "109.0",
        },
    },
    version: packageJson.version,
    description: "__MSG_extensionDescription__",
    host_permissions: [
        "https://raw.githubusercontent.com/*",
        "https://forms.gle/*",
        "https://suiguard-385906975905.asia-east1.run.app/*",
        "http://localhost:8000/*",
    ],
    permissions: ["storage", "scripting", "tabs", "notifications", "activeTab"],
    action: {
        default_popup: "popup/index.html",
        default_icon: "logo48.png",
        default_title: "SUI Blocklist Detector",
    },
    icons: {
        "128": "logo128.png",
    },
    content_scripts: [
        {
            matches: ["http://*/*", "https://*/*", "<all_urls>"],
            css: ["content.css"],
        },
    ],
    web_accessible_resources: [
        {
            resources: ["*.js", "*.css", "*.svg", "icon-128.png", "icon-34.png"],
            matches: ["*://*/*"],
        },
    ],
};
export default manifest;
