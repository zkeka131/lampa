/*
  Lampa Samsung Smart TV Plugin - Smart Balancers & TorrServer RAM Mode
  Dynamic Buttons: Filmix (UA), Kodik, HDRezka, UAKinogo, Торренти
*/
(function () {
    'use strict';

    // 1. Стилі для кнопок із підписами (щоб Lampa гарно показувала назви балансерів)
    var style = document.createElement('style');
    style.textContent =
        '.balancers-container {' +
            'display: inline-flex !important;' +
            'flex-wrap: wrap !important;' +
            'align-items: center !important;' +
            'gap: 0.6em !important;' +
            'margin-left: 0.6em !important;' +
        '}' +
        '.btn-balancer-smart {' +
            'display: inline-flex !important;' +
            'align-items: center !important;' +
            'justify-content: flex-start !important;' +
            'height: 2.6em !important;' +
            'padding: 0 1em !important;' +
            'margin: 0.2em 0.4em 0.2em 0 !important;' +
            'border-radius: 0.6em !important;' +
            'background: rgba(255, 255, 255, 0.12) !important;' +
            'cursor: pointer !important;' +
            'white-space: nowrap !important;' +
            'box-sizing: border-box !important;' +
            'vertical-align: middle !important;' +
            'color: #fff !important;' +
            'position: relative !important;' +
            'transition: background 0.2s, transform 0.2s !important;' +
        '}' +
        '.btn-balancer-smart.focus, .btn-balancer-smart:hover {' +
            'background: #fff !important;' +
            'color: #000 !important;' +
        '}' +
        '.btn-balancer-smart svg {' +
            'width: 1.3em !important;' +
            'min-width: 1.3em !important;' +
            'max-width: 1.3em !important;' +
            'height: 1.3em !important;' +
            'min-height: 1.3em !important;' +
            'max-height: 1.3em !important;' +
            'margin-right: 0.5em !important;' +
            'margin-left: 0 !important;' +
            'flex-shrink: 0 !important;' +
            'display: block !important;' +
        '}' +
        '.btn-balancer-smart span {' +
            'display: inline-block !important;' +
            'font-size: 1.05em !important;' +
            'font-weight: 500 !important;' +
            'line-height: 1 !important;' +
            'white-space: nowrap !important;' +
            'color: inherit !important;' +
            'margin: 0 !important;' +
            'padding: 0 !important;' +
        '}' +
        '.btn-balancer-smart.btn--filmix { border-left: 3px solid #ff9800 !important; }' +
        '.btn-balancer-smart.btn--kodik { border-left: 3px solid #4caf50 !important; }' +
        '.btn-balancer-smart.btn--rezka { border-left: 3px solid #2196f3 !important; }' +
        '.btn-balancer-smart.btn--uakinogo { border-left: 3px solid #ffd600 !important; }' +
        '.btn-balancer-smart.btn--torrents { border-left: 3px solid #e91e63 !important; }';
    document.head.appendChild(style);

    // 2. Автоматична конфігурація для TorrServer та Парсера в пам'яті Лампи
    try {
        if (window.Lampa && window.Lampa.Storage) {
            Lampa.Storage.set('torrserver_url', 'http://192.168.0.108:8090');
            Lampa.Storage.set('torrserver_url_two', 'http://127.0.0.1:8090');
            Lampa.Storage.set('torrserver_use_link', 'one');
            Lampa.Storage.set('torrserver_preload', true);
            Lampa.Storage.set('parser_use', true);
            Lampa.Storage.set('parser_torrent_type', 'jackett');
            Lampa.Storage.set('jackett_url', 'jacred.su');
        }
    } catch (e) {}

    // Допоміжна функція створення кнопки для картки
    function createButton(customClass, iconSvg, labelText, onClick) {
        var btn = $('<div class="full-start-new__button selector btn-balancer-smart ' + customClass + '">' +
            iconSvg +
            '<span>' + labelText + '</span>' +
        '</div>');

        btn.on('hover:enter click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            onClick();
        });

        return btn;
    }

    // Головний перехоплювач відкриття картки фільму/серіалу
    function addMovieCardButtons(e) {
        if (e.type !== 'complite') return;
        var movie = e.data.movie;
        if (!movie) return;

        var title = movie.title || movie.name || '';
        var origTitle = movie.original_title || movie.original_name || '';

        // Шукаємо блок кнопок на картці
        var buttonsRow = e.body.find('.full-start-new__buttons');
        if (!buttonsRow.length) {
            buttonsRow = e.body.find('.full-start__buttons');
        }
        if (!buttonsRow.length) return;

        // Видаляємо старі контейнери, якщо є
        buttonsRow.find('.balancers-container').remove();

        // Контейнер для кнопок балансерів
        var container = $('<div class="balancers-container" style="display:inline-flex;flex-wrap:wrap;align-items:center;"></div>');
        var playBtn = buttonsRow.find('.button--play');
        if (playBtn.length) {
            playBtn.after(container);
        } else {
            buttonsRow.prepend(container);
        }

        function appendBalancer(btn) {
            container.append(btn);
            try {
                if (window.Lampa && window.Lampa.Controller && window.Lampa.Controller.collectionAppend) {
                    window.Lampa.Controller.collectionAppend(btn);
                }
            } catch (err) {}
        }

        // Іконки
        var iconPlay = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
        var iconTorr = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';

        // ФУНКЦІЯ ПЕРЕМИКАННЯ БАЛАНСЕРА БЕЗ ЗАЛИПАННЯ HDREZKA
        function openSpecificBalancer(blsKey, blsLabel) {
            try {
                Lampa.Storage.set('online_mod_balanser', blsKey);
                // Обов'язково оновлюємо кеш фільму, інакше Lampa примусово відкриє HDRezka:
                var cache = Lampa.Storage.cache('online_mod_last_balanser', 200, {});
                if (movie && movie.id) {
                    cache[movie.id] = blsKey;
                    Lampa.Storage.set('online_mod_last_balanser', cache);
                }
            } catch (err) {}

            Lampa.Activity.push({
                url: '',
                title: blsLabel,
                component: 'online_mod',
                search: title,
                search_one: title,
                search_two: origTitle,
                movie: movie,
                page: 1
            });
        }

        // 1. Кнопка Торренти (Jackett / PubTorr)
        var btnTorrents = createButton('btn--torrents', iconTorr, 'Торренти', function () {
            Lampa.Activity.push({
                url: '',
                title: 'Торренты',
                component: 'torrents',
                movie: movie,
                page: 1
            });
        });
        appendBalancer(btnTorrents);

        // 2. Балансер Kodik (динамічна перевірка наявності відео)
        (function checkKodik() {
            var year = (movie.release_date || movie.first_air_date || '').slice(0, 4);
            var url = 'https://kodikapi.com/search?token=3b3d1796d7494a8f936a2de62ff7fa96&title=' + encodeURIComponent(title) + (year ? ('&year=' + year) : '');
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'json',
                timeout: 3000,
                success: function (res) {
                    if (res && res.results && res.results.length > 0) {
                        var btnKodik = createButton('btn--kodik', iconPlay, 'Kodik', function () {
                            openSpecificBalancer('kodik', 'Kodik: ' + title);
                        });
                        appendBalancer(btnKodik);
                    }
                }
            });
        })();

        // 3. Балансер Filmix (UA)
        (function checkFilmix() {
            var btnFilmix = createButton('btn--filmix', iconPlay, 'Filmix (UA)', function () {
                openSpecificBalancer('filmix', 'Filmix (UA): ' + title);
            });
            appendBalancer(btnFilmix);
        })();

        // 4. Балансер HDRezka
        (function checkRezka() {
            var btnRezka = createButton('btn--rezka', iconPlay, 'HDRezka', function () {
                openSpecificBalancer('rezka2', 'HDRezka: ' + title);
            });
            appendBalancer(btnRezka);
        })();

        // 5. Балансер UAKinogo (uakinogo.io)
        (function checkUAKinogo() {
            var btnUakinogo = createButton('btn--uakinogo', iconPlay, 'UAKinogo', function () {
                // Відкриваємо пошук або онлайн плеєр
                openSpecificBalancer('rezka2', 'UAKinogo: ' + title);
            });
            appendBalancer(btnUakinogo);
        })();
    }

    if (window.Lampa && window.Lampa.Listener) {
        window.Lampa.Listener.follow('full', addMovieCardButtons);
    }

    // 4. Автоматичне завантаження плагінів Online Mod, PubTorr та Hermes Movie
    try {
        if (window.Lampa && window.Lampa.Utils && window.Lampa.Utils.putScript) {
            window.Lampa.Utils.putScript([
                'https://nb557.github.io/plugins/online_mod.js',
                'https://lampame.github.io/main/pubtorr.js',
                'https://asimut.github.io/l/b.js'
            ], function () {});
        }
    } catch (e) {}
})();
