import { browser, Runtime, WebRequest } from "webextension-polyfill-ts";
import OnBeforeSendHeadersDetailsType = WebRequest.OnBeforeSendHeadersDetailsType;
import { ConnectionMessage } from "./types";
import Port = Runtime.Port;

browser.runtime.onInstalled.addListener((details) => {
    console.log("previousVersion", details.previousVersion);
});

browser.tabs.onUpdated.addListener(async (tabId) => {
    console.log("tab", tabId);
});
const getFrame = async ({ parentUrl, frameUrl }: { parentUrl: string; frameUrl: string }) => {
    const tabs = await browser.tabs.query({ currentWindow: true, active: true });
    if (tabs.length === 0) {
        return;
    }
    const currentTab = tabs[0];
    console.log("current tab", currentTab);
    if (!currentTab.url?.startsWith(parentUrl)) {
        return;
    }
    return getFrameInTab({
        tabId: currentTab.id!,
        frameUrl
    });
};
const getFrameInTab = async ({ tabId, frameUrl }: { tabId: number; frameUrl: string }) => {
    const gettingAllFrames = await browser.webNavigation.getAllFrames({ tabId: tabId });
    console.log("gettingAllFrames", gettingAllFrames, frameUrl);
    const exampleFrame = gettingAllFrames.find((frame) => frame.url.startsWith(frameUrl));
    if (!exampleFrame) {
        return;
    }
    console.log("example frame", exampleFrame);
    return exampleFrame;
};
browser.browserAction.onClicked.addListener(async function (tab) {
    console.log("tab", tab);
});
browser.webNavigation.onCompleted.addListener(async (details) => {});

const parentTargetPage = "http://localhost:5000";
const fakeUATargetPage = "https://httpbin.org/get";

function rewriteUserAgentHeader(details: OnBeforeSendHeadersDetailsType) {
    const isIFrame = details.type === "sub_frame" && details.initiator === parentTargetPage;
    if (!isIFrame) {
        return details;
    }
    const FAKE_UA = "FAKE/UA";
    // Can not get getAllFrames because iframe is loading now
    // const frame = await getFrame({
    //     parentUrl: "http://localhost:5000",
    //     frameUrl: fakeUATargetPage
    // });
    // console.log("frame", frame);
    // Replace UA
    details?.requestHeaders?.forEach(function (header) {
        if (header.name.toLowerCase() === "user-agent") {
            header.value = FAKE_UA;
        }
    });
    return { requestHeaders: details.requestHeaders };
}

browser.webRequest.onBeforeSendHeaders.addListener(rewriteUserAgentHeader, { urls: [fakeUATargetPage] }, [
    "blocking",
    "requestHeaders"
]);
// content <- background -> content
const portMap = new Map<string, Port>();
browser.runtime.onConnect.addListener((port) => {
    portMap.set(port.sender?.url!, port);
    port.onMessage.addListener(async (message: ConnectionMessage, port) => {
        console.log(message);
        const frame = await getFrameInTab({
            tabId: port.sender?.tab?.id!,
            frameUrl: message.toUrl
        });
        if (!frame?.url) {
            return console.log("No frame");
        }
        const targetPort = portMap.get(frame?.url);
        if (!targetPort) {
            return console.log("No connect", message);
        }
        targetPort.postMessage(message);
    });
});
