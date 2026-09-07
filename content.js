(() => {
    'use strict';

    const LS_DARK_MODE = 'ortDarkMode_enabled';
    const LS_INVERT_PHOTOS = 'ortDarkMode_invertPhotos';
    const CONTROLS_ID = 'ort-dark-mode-controls';
    const INVERT = 'invert(1) hue-rotate(180deg)';

    const isDarkModeOn = () =>
        localStorage.getItem(LS_DARK_MODE) !== 'false';

    const isInvertPhotosOn = () =>
        localStorage.getItem(LS_INVERT_PHOTOS) === 'true';

    function setImportant(el, prop, value) {
        el.style.setProperty(prop, value, 'important');

        if (prop === 'filter') {
            el.style.setProperty('-webkit-filter', value, 'important');
        }
    }

    function clearFilter(el) {
        el.style.removeProperty('filter');
        el.style.removeProperty('-webkit-filter');
    }

    function applyBaseFilter() {
        if (!document.body) return;

        if (isDarkModeOn()) {
            setImportant(document.body, 'filter', INVERT);
            setImportant(document.documentElement, 'background', '#111');
            setImportant(document.documentElement, 'overflow-x', 'hidden');
            setImportant(document.body, 'overflow-x', 'hidden');
            setImportant(document.body, 'min-height', '100vh');
        } else {
            clearFilter(document.body);
            document.body.style.removeProperty('min-height');
            document.body.style.removeProperty('overflow-x');
            document.documentElement.style.removeProperty('background');
            document.documentElement.style.removeProperty('overflow-x');
        }
    }

    function getMediaElements(root = document) {
        const selector =
            'img, video, iframe, canvas, svg, embed, object, [style*="background-image"]';

        if (root === document) {
            return document.querySelectorAll(selector);
        }

        const result = [];

        if (root.nodeType === Node.ELEMENT_NODE) {
            if (root.matches(selector)) result.push(root);
            result.push(...root.querySelectorAll(selector));
        }

        return result;
    }

    function applyMediaFilter(el) {
        if (
            !el ||
            el.id === CONTROLS_ID ||
            el.closest?.('#' + CONTROLS_ID)
        ) return;

        if (!isDarkModeOn()) {
            clearFilter(el);
            return;
        }

        if (!isInvertPhotosOn()) {
            setImportant(el, 'filter', INVERT);
        } else {
            clearFilter(el);
        }
    }

    function refreshMediaFilters(root = document) {
        getMediaElements(root).forEach(applyMediaFilter);

        const footer = document.querySelector('footer.page-footer');

        if (footer) {
            if (isDarkModeOn()) {
                setImportant(footer, 'filter', INVERT);
            } else {
                clearFilter(footer);
            }
        }
    }

    let btnDarkMode = null;
    let btnInvertPhotos = null;

    function updateButtons() {
        if (btnDarkMode) {
            const enabled = isDarkModeOn();
            btnDarkMode.style.background = enabled ? '#0091ea' : '#f2f2f2';
            btnDarkMode.style.color = enabled ? '#fff' : '#333';
            btnDarkMode.style.borderColor = enabled ? '#0091ea' : '#ccc';
            btnDarkMode.title = enabled
                ? 'Desactivar modo oscuro'
                : 'Activar modo oscuro';
        }

        if (btnInvertPhotos) {
            const enabled = isInvertPhotosOn();
            btnInvertPhotos.style.background = enabled ? '#0091ea' : '#f2f2f2';
            btnInvertPhotos.style.color = enabled ? '#fff' : '#333';
            btnInvertPhotos.style.borderColor = enabled ? '#0091ea' : '#ccc';
            btnInvertPhotos.title = enabled
                ? 'Desactivar inversión de imágenes'
                : 'Activar inversión de imágenes';
        }
    }

    function makeButton(label) {
        const btn = document.createElement('button');

        Object.assign(btn.style, {
            all: 'initial',
            boxSizing: 'border-box',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            border: '1px solid #ccc',
            background: '#f2f2f2',
            color: '#333',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
            userSelect: 'none',
            fontFamily: 'sans-serif',
            padding: '0',
            margin: '0'
        });

        btn.type = 'button';
        btn.textContent = label;
        return btn;
    }

    function createControls() {
        if (!document.body || document.getElementById(CONTROLS_ID)) return;

        const container = document.createElement('div');
        container.id = CONTROLS_ID;

        Object.assign(container.style, {
            all: 'initial',
            position: 'fixed',
            top: '10px',
            left: '10px',
            right: 'auto',
            zIndex: '2147483647',
            display: 'flex',
            gap: '6px',
            opacity: '0.85',
            width: 'auto',
            height: 'auto',
            pointerEvents: 'auto'
        });

        btnDarkMode = makeButton('🌓');
        btnDarkMode.addEventListener('click', () => {
            localStorage.setItem(LS_DARK_MODE, String(!isDarkModeOn()));
            applyBaseFilter();
            refreshMediaFilters();
            updateButtons();
        });

        btnInvertPhotos = makeButton('🖼️');
        btnInvertPhotos.addEventListener('click', () => {
            localStorage.setItem(
                LS_INVERT_PHOTOS,
                String(!isInvertPhotosOn())
            );
            refreshMediaFilters();
            updateButtons();
        });

        container.appendChild(btnDarkMode);
        container.appendChild(btnInvertPhotos);
        document.documentElement.appendChild(container);
        updateButtons();
    }

    function init() {
        createControls();
        applyBaseFilter();
        refreshMediaFilters();
        updateButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }

    let refreshScheduled = false;

    function scheduleRefresh() {
        if (refreshScheduled) return;
        refreshScheduled = true;

        requestAnimationFrame(() => {
            refreshScheduled = false;

            if (!document.getElementById(CONTROLS_ID)) {
                createControls();
            }

            refreshMediaFilters();
        });
    }

    function startObserving() {
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', startObserving, { once: true });
            return;
        }

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (
                    mutation.type === 'childList' &&
                    mutation.addedNodes.length
                ) {
                    scheduleRefresh();
                    return;
                }

                if (
                    mutation.type === 'attributes' &&
                    ['src', 'class', 'style', 'width', 'height'].includes(
                        mutation.attributeName
                    )
                ) {
                    scheduleRefresh();
                    return;
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'class', 'style', 'width', 'height']
        });
    }

    startObserving();
})();
