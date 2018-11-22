(function () {

    const $editor = document.querySelector("#editor")
        , $modal = document.querySelector("#modal")
        , $console = document.querySelector("#console")
        , $shortcutsBtn = document.querySelector("#shortcutsBtn")
        , $runBtn = document.querySelector("#runBtn")
        , $clearBtn = document.querySelector("#clearBtn")
        , WELCOME_MESSAGE = `/* enter code here... */\n\n`
        , interceptedConsoleFnOptions = {
            log: ["#000000"],
            error: ["#ff0000"],
            info: ["#0000ff"]
        }
        , interceptKeys = [
            9, // tab
            13 // enter
        ];

    let unmountLegend = null;

    Quickey.core.createQuickey({
        id: "editor",
        title: "Editor Shortcuts",
        target: $editor,
        actions: [{
            id: "runCode",
            description: "Run Code",
            keys: "Ctrl + Shift + R",
            callback: onRun
        }, {
            id: "clearLog",
            description: "Clear Log",
            keys: "Ctrl + Shift + C",
            callback: onClear
        }]
    });

    /**
     * Intercept console function
     */
    console = new Proxy(console, {
        get: (target, prop) => {
            if (prop in interceptedConsoleFnOptions) {
                return function (...args) {
                    target[prop](...args);
                    addLog(args, interceptedConsoleFnOptions[prop]);
                }
            }

            return target[prop];
        }
    });

    function addEvent(el, event, handler, options = false) {
        el && el.addEventListener(event, handler, options);
    }

    function removeEvent(el, event, handler) {
        el && el.removeEventListener(event, handler);
    }

    function insertStringAtElementSelectionCurrentPosition(string, element, selection) {
        element.focus();

        const anchorOffset = selection.anchorOffset;

        element.innerText = [
            element.innerText.slice(0, anchorOffset),
            string,
            element.innerText.slice(anchorOffset)
        ].join('');

        const range = document.createRange();

        range.setStart(element.childNodes[0], anchorOffset + 1);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);
    }

    function onEditorKeyDown(e) {
        if (!~interceptKeys.indexOf(e.which)) {
            return;
        }

        const selection = window.getSelection();

        if (e.which === 9 && !e.shiftKey) {
            e.preventDefault();
            insertStringAtElementSelectionCurrentPosition(
                "\t",
                $editor,
                selection
            );
        }

        if (e.which === 13) {
            e.preventDefault();
            insertStringAtElementSelectionCurrentPosition(
                !$editor.childNodes[0] || selection.anchorOffset === $editor.childNodes[0].length ? "\n\n" : "\n",
                $editor,
                selection
            );
        }
    }

    function onRun() {
        let codeBlock = Array.from($editor.childNodes).map((node) => node.data).join("\n");
        if (codeBlock) {
            try {
                Function(codeBlock)();
            } catch (e) {
                addLog([e], "red");
                throw e;
            }
        }
    }

    function onClear() {
        $console.innerHTML = "";
    }

    function addLog(data, color = "#000000") {
        const p = document.createElement("p");
        p.innerText = data.toString();
        p.style.color = color;
        $console.prepend(p);
    }

    function onPasteCode(e) {
        e.preventDefault();

        insertStringAtElementSelectionCurrentPosition(
            e.clipboardData.getData('text'),
            $editor,
            window.getSelection()
        );
    }

    function onShortcuts() {
        if (unmountLegend) {
            unmountLegend();
            unmountLegend = null;
            $modal.classList.remove("show");
            return;
        }

        unmountLegend = Quickey.ui.createQuickeyLegend({
            ids: ["editor"],
            el: $modal,
            style: { minWidth: 500 }
        });

        $modal.classList.add("show");
    }

    addEvent($editor, "paste", onPasteCode)
    addEvent($editor, "keydown", onEditorKeyDown);
    addEvent($runBtn, "click", onRun);
    addEvent($clearBtn, "click", onClear);
    addEvent($shortcutsBtn, "click", onShortcuts);

    $editor.append(document.createTextNode(WELCOME_MESSAGE));
})();