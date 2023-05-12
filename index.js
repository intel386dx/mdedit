MDEditVersion = [0, 1];

function $i(id) {
    return document.getElementById(id);
}

openedFileName = "Untitled.md";
lastSavedContent = "";
function updateTitle(x) {
    document.getElementsByTagName("title")[0].innerHTML = x;
};
updateTitle(openedFileName);
function openFile(callback) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".md, .markdown, .htm, .html";
    fileName = "";
    fileExt = "";
    fileContent = "";
    fileInput.onchange = function(x) {
        file = x.target.files[0]
        reader = new FileReader();
        fileName = file.name;
        fileExt = file.name.substring(file.name.lastIndexOf(".") + 1);
        reader.onload = function(x) {
            fileContent = x.target.result;
            callback({
                name: fileName,
                ext: fileExt,
                content: fileContent
            });
        };
        reader.readAsText(file);
    };
    fileInput.click();
};

function saveFile (mimeType, data, fileName) {
    url = URL.createObjectURL(new Blob([data], {
        type: mimeType
    }))
    link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
};

function tglSelTxt(el, start, end, debugMode) {
    startPos = el.selectionStart;
    debugMode && console.log("start selection position: " + startPos);
    endPos = el.selectionEnd;
    debugMode && console.log("end selection position: " + endPos);
    txt = el.value.toString();
    debugMode && console.log("text = " + txt);
    before = txt.substring(0, startPos);
    debugMode && console.log("text before selection = " + before);
    after = txt.substring(endPos);
    debugMode && console.log("text after selection = " + after);
    selected = txt.substring(startPos, endPos);
    debugMode && console.log("selection = " + selected);
    newSelected = selected;
    if (after.startsWith(start) && before.endsWith(end)) {
        before2 = before.substring(0, startPos - start.length);
        after2 = after.substring(end.length);
        el.value = before2 + newSelected + after2;
        el.selectionStart = before2.length;
        el.selectionEnd = before2.length + newSelected.length;
        debugMode && console.log("Has been trimmed to " + newSelected);
    } else if (selected.startsWith(start) && selected.endsWith(end)) {
        newSelected = selected.substring(start.length, selected.length - end.length);
        el.selectionStart = before.length;
        el.selectionEnd = before.length + newSelected.length;
        debugMode && console.log("Has been trimmed to " + newSelected);
        el.value = before + newSelected + after;
    } else {
        newSelected = start + selected + end;
        el.selectionStart = before.length;
        el.selectionEnd = before.length + newSelected.length;
        debugMode && console.log("Has been appended to " + newSelected);
        el.value = before + newSelected + after;
    };
};
cursorStart = null;
cursorEnd = null;
updateCursorPos = null;
function startCursorPos() {
	updateCursorPos = setInterval(function() {
		try {
            cursorStart = $i("editor-edit-field").selectionStart;
            cursorEnd = $i("editor-edit-field").selectionEnd;
            $i("cursor-start").innerHTML = cursorStart;
            $i("cursor-end").innerHTML = cursorEnd;
        } catch(x) {
            e = x;
        };
	}, 50);
};
function stopCursorPos() {
	clearInterval(updateCursorPos);
};
startCursorPos();

if (typeof navigator.clipboard.readText != "function") {
	$i("editor-container").classList.add("no-clipboard");
};

function copyText(el, cutText) {
    start = cursorStart | 0;
    console.log("start: " + start);
    end = cursorEnd | el.value.length;
    console.log("end: " + end);
    before = el.value.substring(0, start);
    console.log("before: " + before);
    after = el.value.substring(end);
    console.log("after: " + after);
    toBeCopied = el.value.substring(start, end);
    console.log("to be copied: " + toBeCopied);
    navigator.clipboard.writeText(toBeCopied).then(function() {
        console.log((cutText? "Text has been cut" : "Text has been copied"))
    }, function(x) {
        console.error((cutText? "Cannot cut the text" : "Cannot copy text") + ". Reason: \n");
        console.error(x);
    });
    resultingText = before + (!cutText? toBeCopied : "") + after;
    el.value = resultingText;
};

function pasteText(el) {
    console.log("Pasting procedure has been called");
    start = cursorStart | 0;
    console.log("start: " + start);
    end = cursorEnd;
    console.log("end: " + end);
    before = el.value.substring(0, start);
    console.log("before: " + before);
    after = el.value.substring(end);
    console.log("after: " + after);
    toBeReplaced = el.value.substring(start, end);
    console.log("to be replaced: " + toBeReplaced);
    navigator.clipboard.readText().then(function(x) {
        toBeReplaced = x;
        console.log("text in clipboard: " + x);
        resultingText = before + toBeReplaced + after;
        console.log("resulting text: " + resultingText);
        el.value = resultingText;
    }, function(x) {
        console.error("Cannot get the clipboard contents. Reason: \n" + x);
    });
};

undoHistory = [];
const undoMaxlength = 50;
undoInput = $i("editor-edit-field");
undoIndex = -1;
function saveState() {
    undoMaxLength = 50;
    value = undoInput.value;
    if (undoHistory.length && undoHistory[undoIndex] == value) return;
    undoHistory.splice(undoIndex + 1, undoHistory.length - undoIndex, value);
    console.log(undoMaxLength);
    if (undoHistory.length > undoMaxLength) undoHistory.shift();
    undoIndex = undoHistory.length - 1;
};
function undo() {
    if (undoIndex > 0) {
        undoIndex = undoIndex - 1;
        if (typeof undoHistory[undoIndex] !== "undefined") undoInput.value = undoHistory[undoIndex];
    };
};
function redo() {
    if (undoIndex < undoHistory.length - 1) {
        undoIndex = undoIndex - 1;
        if (typeof undoHistory[undoIndex] !== "undefined") undoInput.value = undoHistory[undoIndex];
    };
};
saveStateTimeout = null;
undoInput.oninput = function() {
    clearTimeout(saveStateTimeout);
    saveStateTimeout = setTimeout(function() {
        saveState();
    }, 1000);
};

window.fullScreen = false;
function toggleFullscreen() {
    doc = document.documentElement;
    if (!window.fullScreen) {
        if (doc.requestFullscreen) {
            doc.requestFullscreen();
        } else if (doc.webkitRequestFullscreen) { 
            doc.webkitRequestFullscreen();
        } else if (doc.msRequestFullscreen) { 
            doc.msRequestFullscreen();
        };
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { 
            document.msExitFullscreen();
        };
    };
    doc.onfullscreenchange = function(x) {
        window.fullScreen = document.fullscreenElement != null;
    };
};

window.onbeforeunload = function() {
    return "";
};

selfCheckInterval = "";
function selfCheck() {
    try {
        if (marked && DOMPurify && (new TurndownService())) {
            $i("missing").style.display = "none"
        } else {
            clearInterval(selfCheckInterval)
        };
    } catch(x) {
        e = x;
    }
};
selfCheckInterval = setInterval(selfCheck, 100);

function parse(markdown) {
    return DOMPurify.sanitize(marked.parse(markdown));
};
function parseHTML(html) {
    return DOMPurify.sanitize((new TurndownService()).turndown(html).toString());
};

function refreshFrame() {
    startTime = Date.now();
    (function () {
        let font = $i("font-family").value.toString() !== ""?
                   $i("font-family").value.toString() :
                   "Arial, sans-serif";
        let sanitizedFont = font.replace(";", " ");
        frame = $i("editor-preview-frame").contentWindow.document;
        frame.open();
        frame.write(
        `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Marked render result</title>
        <style>
        a {
            color: #08c;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        a:active {
            color: #480;
        }
        code,
        output,
        kbd,
        pre {
            font-family: Consolas, "Lucida Console", "Courier New", Courier,
                monospace;
                border: 1px solid #ddd;
                background-color: #f8f8f8;
            padding-inline: 4px;
        }
        pre {
            padding: 8px;
            overflow: auto;
        }
        pre code {
            background-color: transparent;
            border: 0px solid;
            margin: 0px;
            padding-inline: 0px;
        }
        th {
            background-color: #f0f0f0;
        }
        td, th {
            padding: 4px;
        }
        table, tr, td, th {
            border: 1px solid #ddd;
        }
        table {
            overflow: auto;
            max-height: 100vh;
            max-width: 100%;
            border-collapse: collapse;
        }
        blockquote {
            background-color: #fcfcfc;
            border: 1px solid #ddd;
            padding: 8px 8px 8px 12px;
            margin: 0px 0px 16px 0px;
            box-shadow: 4px 0px #08c inset;
        }
        blockquote p {
            margin: 0px 0px;
            width: 100%;
        }
        blockquote p + p {
            margin-top: 16px;
        }
        @media (prefers-color-scheme: dark) {
            * {
                scrollbar-color: #222;
            }
        	body {
        	    color: white;
            }
            table, th, td {
            	border-color: #666;
            }
            th {
            	background-color: #444;
            }
            code,
	        output,
	        kbd,
	        pre {
	            font-family: Consolas, "Lucida Console", "Courier New", Courier,
	                monospace;
	                border: 1px solid #666;
	                background-color: #444;
	            padding-inline: 4px;
	        }
        }
        </style>
        </head>
        <body style="font-family:${sanitizedFont}">
        ${parse($i("editor-edit-field").value.toString(), font)}
        </body>
        </html>`
        );
        frame.close();
    })();
    execTime = Date.now() - startTime;
    $i("parse-time").innerHTML = execTime.toString();
};
$i("preview-tab").onclick = $i("refresh-frame").onclick = refreshFrame;

function toggleAutosplit() {
    $i("editor-container").classList.toggle("autosplit")
};
$i("cmd-toggle-autosplit").onclick = toggleAutosplit;

$i("cmd-new").onclick = function() {
    window.location.reload()
};
$i("cmd-open").onclick = function() {
    function x() {
        openFile(function(x) {
            openedFileName = x.name;
            updateTitle(x.name);
            openedContent = x.ext == "htm" || x.ext == "html"? parseHTML(x.content) : x.content;
            lastSavedContent = openedContent;
            $i("editor-edit-field").value = openedContent;
        });
    };
    if ($i("editor-edit-field").value != lastSavedContent) {
        confirm("Are you sure to lose changes to this file?") && x();
    } else {
        x();
    };
};
$i("cmd-save-md").onclick = function() {
    saveFile("text/markdown", $i("editor-edit-field").value.toString(), openedFileName);
    lastSavedContent = openedContent;
};
$i("cmd-save-html").onclick = function() {
	saveName = openedFileName.split(".");
	saveName[saveName.length - 1] = "htm";
    saveFile("text/markdown", parse($i("editor-edit-field").value.toString(), null), saveName.join("."));
    lastSavedContent = $i("editor-edit-field").value;
};
$i("cmd-copy").onclick = function() {
	copyText($i("editor-edit-field"), false);
};
$i("cmd-cut").onclick = function() {
	copyText($i("editor-edit-field"), true);
};
$i("cmd-paste").onclick = function() {
	pasteText($i("editor-edit-field"));
};
$i("cmd-select-all").onclick = function() {
    $i("editor-edit-field").select()
};
$i("cmd-undo").onclick = function() {
	undo();
};
$i("cmd-redo").onclick = function() {
    redo();
};
$i("cmd-full-screen").onclick = function() {
    toggleFullscreen()
};
$i("cmd-refresh-frame").onclick = function() {
    $i("preview-tab").click();
};
$i("cmd-markdown-guide").onclick = function() {
    window.open("https://www.markdownguide.org/", "_blank").focus()
};
$i("cmd-about").onclick = function() {
    alert(`MDEdit v${MDEditVersion.join(".")}\n
${"\u00A9"} 2023 Hilman Ahwas A.

Licensed under the Apache License version 2.0 (see LICENSE in this directory)

This application uses following third-party components. They are licensed with their respective licenses.
1. Bootstrap 2.3.2 - The MIT License
2. DOMPurify 3.0.3 - Apache License 2.0
3. jQuery 3.6.4 - The MIT License
4. MarkedJS 5.0.1 - The MIT License
5. Turndown 7.1.2 - The MIT License
6. Google Material Icons - Apache License 2.0

Thanks to all the developers and contributors of the components above and on the Stack Overflow!`)
};
document.onkeydown = function(x) {
    if (x.altKey) {
        if (x.shiftKey) {
            switch(x.code) {
                case "F1": $i("cmd-about").click();
                case "KeyF": $i("cmd-full-screen").click();
                case "KeyA": $i("cmd-toggle-autosplit").click();
                case "KeyS": $i("cmd-save-html").click();
                case "KeyE": $i("cmd-refresh-frame").click();
            };
        };
        switch(x.code) {
            case "F1": $i("cmd-markdown-guide").click();
            case "KeyN": $i("cmd-new").click();
            case "KeyO": $i("cmd-open").click();
            case "KeyS": $i("cmd-save-md").click();
            // case "KeyC": $i("cmd-copy").click();
            // case "KeyX": $i("cmd-cut").click();
            // case "KeyV": $i("cmd-paste").click();
            // case "KeyA": $i("cmd-select-all").click();
            case "KeyZ": $i("cmd-undo").click();
            case "KeyY": $i("cmd-redo").click();
        };
    };
    switch(x.code) {
        // case "F5": $i("cmd-refresh-frame").click();
    };
};