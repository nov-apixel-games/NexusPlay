/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-5d155c7a'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "manifest.json",
    "revision": "4efa1483b944bd1bfd97d7dcf54a0a4d"
  }, {
    "url": "index.html",
    "revision": "dda48e6cb32a75ace0ac9807c99684d9"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/web-CGaP4jEo.js",
    "revision": null
  }, {
    "url": "assets/supabase-DQh0Fvtg.js",
    "revision": null
  }, {
    "url": "assets/recharts-BkbAYVge.js",
    "revision": null
  }, {
    "url": "assets/react-vendor-Cg_rRddc.js",
    "revision": null
  }, {
    "url": "assets/phaser--MIaX3ER.js",
    "revision": null
  }, {
    "url": "assets/monaco-BfLCcPUg.js",
    "revision": null
  }, {
    "url": "assets/lucide-tgxckoTE.js",
    "revision": null
  }, {
    "url": "assets/index-DuF8zkEI.js",
    "revision": null
  }, {
    "url": "assets/index-BQ1VF3eH.js",
    "revision": null
  }, {
    "url": "assets/index-BKsVf6H8.css",
    "revision": null
  }, {
    "url": "assets/SmartTools-CJ3rIhGV.js",
    "revision": null
  }, {
    "url": "assets/SmartHubView-QIysCAbK.js",
    "revision": null
  }, {
    "url": "assets/SettingsView-BYdBxPzs.js",
    "revision": null
  }, {
    "url": "assets/PublishingWizard-LdaQKKhM.js",
    "revision": null
  }, {
    "url": "assets/ProfileView-W_f4RJ3s.js",
    "revision": null
  }, {
    "url": "assets/OnboardingView-DxKBjGTH.js",
    "revision": null
  }, {
    "url": "assets/NexusStudio-C5ravk8G.js",
    "revision": null
  }, {
    "url": "assets/NexusHub-CBm_aKri.js",
    "revision": null
  }, {
    "url": "assets/MainViews-DVf1u0R6.js",
    "revision": null
  }, {
    "url": "assets/LegalViews-yarrCobC.js",
    "revision": null
  }, {
    "url": "assets/GamesHubView-CL33pJdz.js",
    "revision": null
  }, {
    "url": "assets/GameStudioEditor-8DH5j13E.js",
    "revision": null
  }, {
    "url": "assets/DeveloperPanel-DWwDYPfx.js",
    "revision": null
  }, {
    "url": "assets/DeveloperAnalytics-Co2wkJOc.js",
    "revision": null
  }, {
    "url": "assets/AuthModal-UbUVrJx0.js",
    "revision": null
  }, {
    "url": "assets/AppDetailView-BLSGGCZl.js",
    "revision": null
  }, {
    "url": "assets/AdminViews2-BFpk6zLM.js",
    "revision": null
  }, {
    "url": "assets/AdminUsers-CM7DY0cZ.js",
    "revision": null
  }, {
    "url": "assets/AdminStatistics-hc4yHWQi.js",
    "revision": null
  }, {
    "url": "assets/AdminSecurity-DBiDoqwY.js",
    "revision": null
  }, {
    "url": "assets/AdminNotifications-MHoMoCkv.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboard-CfMdjqDS.js",
    "revision": null
  }, {
    "url": "assets/AdminApps-Bt15VopO.js",
    "revision": null
  }, {
    "url": "manifest.webmanifest",
    "revision": "db917164afd8277d6c33488b5f8dbbde"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html")));
  workbox.registerRoute(/^https:\/\/res\.cloudinary\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "cloudinary-images",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/.*\.supabase\.(co|js)\/rest\/v1\/.*/i, new workbox.NetworkFirst({
    "cacheName": "supabase-api-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 86400
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
