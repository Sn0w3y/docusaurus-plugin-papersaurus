/**
 * Copyright (c) Bucher + Suter.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {LoadContext, Plugin} from '@docusaurus/types';
import {generatePdfFiles} from './generate';
import {PluginOptions, PapersaurusPluginOptions} from './types';
import {processOptions} from './validateOptions';

export default function (
  _context: LoadContext,
  options?: PluginOptions,
): Plugin<void> {

  let pluginOptions:PapersaurusPluginOptions = processOptions(options);

  return {

    name: 'docusaurus-plugin-papersaurus',

    injectHtmlTags() {

      if (!pluginOptions.addDownloadButton) {
        return {};
      }

      // Use siteConfig from context - works with both .ts and .js config files
      const siteConfig = _context.siteConfig;

      return {
        headTags: [`
        <script>
          var pdfData = {};

          const getBaseUrl = function () {
            return '${siteConfig.baseUrl}${siteConfig.baseUrl?.endsWith("/") ? "" : "/"}';
          };

          const stripTrailingSlash = (str) => {
            return str.endsWith('/') ? str.slice(0, -1) : str;
          };

          const getCurrentPagePdf = function () {
            var activePdfData = pdfData[stripTrailingSlash(document.location.pathname)] || [];
            // Find the chapter (current page) PDF
            for (var i = 0; i < activePdfData.length; i++) {
              if (activePdfData[i].type === 'chapter') {
                return getBaseUrl() + activePdfData[i].file;
              }
            }
            return null;
          };

          const updatePdfButton = function () {
            var pdfUrl = getCurrentPagePdf();
            var btn = document.getElementById('pdfDownloadBtn');
            if (btn) {
              if (pdfUrl) {
                btn.href = pdfUrl;
                btn.style.display = '';
              } else {
                btn.style.display = 'none';
              }
            }
          };

          const checkAndInsertPdfButton = function () {
            if (!document.querySelector('html.plugin-docs')) {
              return;
            }
            if (!document.getElementById('pdfDownloadBtn')) {
              var navRight = document.querySelector('.navbar__items--right');
              if (navRight) {
                var btn = document.createElement('a');
                btn.id = 'pdfDownloadBtn';
                btn.className = 'navbar__item navbar__link';
                btn.href = '#';
                btn.download = '';
                btn.innerHTML = '${pluginOptions.downloadButtonText}';
                btn.style.cssText = 'cursor:pointer;';
                navRight.insertBefore(btn, navRight.firstChild);
                updatePdfButton();
              }
            }
          };

          window.addEventListener('load', function () {
            fetch(getBaseUrl() + 'pdfs.json')
              .then(function(response) { return response.json(); })
              .then(function (json) {
                pdfData = json;
                checkAndInsertPdfButton();
                setInterval(function() {
                  checkAndInsertPdfButton();
                  updatePdfButton();
                }, 1000);
              });
          });
        </script>`
        ],
      };
    },

    async postBuild(props) {
      let forceBuild = process.env.BUILD_PDF || "";
      if ((pluginOptions.autoBuildPdfs && !forceBuild.startsWith("0")) || forceBuild.startsWith("1")) {
        await generatePdfFiles(_context.outDir, pluginOptions, props);
      }
    },

  };
}

export { validateOptions } from "./validateOptions";
