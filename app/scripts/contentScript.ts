import { browser } from "webextension-polyfill-ts";
import { ConnectionMessage } from "./types";

console.log("content script", location.href);
window.addEventListener("load", () => {
    document.body.appendChild(document.createTextNode("INJECTED"));
});
//
const port = browser.runtime.connect();
const PARENT_URL = "http://localhost:5000/";
const CHILD_URL = "https://vuejs.org/v2/guide/list.html";
const parentMain = () => {
    console.log("parentMain");
    port.postMessage({
        type: "scroll",
        toUrl: CHILD_URL,
        selector: "#Array-Change-Detection" // scroll to #Array-Change-Detection
    });
};
const childMain = () => {
    console.log("ChildMain");
    port.onMessage.addListener((event: ConnectionMessage) => {
        console.log("Receive Event", event);
        if (event.type === "scroll") {
            const element = document.querySelector(event.selector);
            console.log("scroll to", event.selector);
            element?.scrollIntoView();
        }
    });
};
// order: child → parent
if (location.href === CHILD_URL) {
    childMain();
}
setTimeout(() => {
    if (location.href === PARENT_URL) {
        parentMain();
    }
}, 2000);
