console.log("content script", location.href);
window.addEventListener("load", () => {
    document.body.appendChild(document.createTextNode("INJECTED"));
});
