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
    startSel = el.selectionStart;
    debugMode && console.log("start selection position: " + startSel);

    endSel = el.selectionEnd;
    debugMode && console.log("end selection position: " + endSel);
    
    startPos = startSel = 0? Math.abs(startSel - start.length + 1) : 0;
    debugMode && console.log("start position = " + startPos);

    endPos = Math.abs(endSel + end.length - 1);
    debugMode && console.log("end position = " + endPos);

    txt = el.value.toString();
    debugMode && console.log("text = " + txt);

    before = txt.substring(0, startPos);
    debugMode && console.log("text before selection = " + before);

    after = txt.substring(endPos);
    debugMode && console.log("text after selection = " + after);

    before2 = txt.substring(0, startPos - 1);
    debugMode && console.log("text before selection 2 = " + before);

    after2 = txt.substring(endPos + 1);
    debugMode && console.log("text after selection 2 = " + after);

    selected = txt.substring(startPos, endPos);
    selected2 = txt.substring(startPos - 1, endPos + 2)
    debugMode && console.log("selection = " + selected);
    debugMode && console.log("selection 2 = " + selected2);

    newSelected = selected;
    if (selected2.startsWith(start) && selected2.endsWith(end)) {
        newSelected = selected2.substring(start.length, selected2.length - end.length);
        el.selectionStart = startPos - 1; el.selectionEnd = endPos + 2;
        debugMode && console.log("Has been trimmed to " + newSelected);
        el.value = before2 + newSelected + after2;
    } else if (selected.startsWith(start) && selected.endsWith(end)) {
        newSelected = selected.substring(start.length, selected.length - end.length);
        el.selectionStart = startPos - 1; el.selectionEnd = endPos + 2;
        debugMode && console.log("Has been trimmed to " + newSelected);
        el.value = before + newSelected + after;
    } else {
        newSelected = start + selected + end;
        el.selectionStart = startPos; el.selectionEnd = endPos;
        debugMode && console.log("Has been appended to " + newSelected);
        el.value = before + newSelected + after;
    };
};

window.onbeforeunload = function() {
    return "";
};

selfCheckInterval = "";
function selfCheck() {
    if (marked && DOMPurify && (new TurndownService())) {
        $i("missing").style.display = "none"
    } else {
        clearInterval(selfCheckInterval)
    };
};
selfCheckInterval = setInterval(selfCheck, 100);

function parse(markdown, fonts) {
    sanitizedFonts = fonts.replace(";", "");
    return DOMPurify.sanitize("<article style='font-family:" + sanitizedFonts + "'>" + marked.parse(markdown) + "</article>");
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
        }
        pre {
            padding: 8px;
            overflow: auto;
        }
        pre code {
            background-color: transparent;
            border: 0px solid;
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
        </style>
        </head>
        <body>
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
    $i("tab-container").classList.toggle("autosplit")
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