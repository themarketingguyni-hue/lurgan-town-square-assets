(function () {
  var source = "https://assets.cdn.filesafe.space/gtT3V5aXZHbJEfkqZpwi/media/6a97e1660ba3728cefccc5d2.mp4";
  var poster = "https://cdn.jsdelivr.net/gh/themarketingguyni-hue/lurgan-town-square-assets@main/lurgan-coming-soon-vsl-poster.png";
  var css = `
    @media (max-width: 767px) {
      html, body { width:100%!important; max-width:100%!important; min-width:0!important; overflow-x:clip!important; }
      *, *::before, *::after { box-sizing:border-box!important; }
      main, main>section, #ts-hero-frame, .launch-stage, .ts-benefits-section,
      .ts-why-white-section, #ts-tenner-pricing, #founding-access {
        width:100%!important; max-width:100%!important; min-width:0!important;
      }
      html body main>section, html body main>section>section,
      section[aria-labelledby="business-benefits-title"],
      section[aria-labelledby="why-town-square-title"], #ts-hero-frame,
      .launch-stage, .ts-benefits-section, .ts-why-white-section,
      #ts-tenner-pricing, #founding-access {
        width:100vw!important; max-width:none!important;
        margin-left:calc(50% - 50vw)!important;
        margin-right:calc(50% - 50vw)!important;
        border-left:0!important; border-right:0!important;
        border-radius:0!important;
      }
      main>section, #ts-hero-frame, .ts-benefits-section, .ts-why-white-section,
      #ts-tenner-pricing, #founding-access { overflow-x:hidden!important; }
      img, video, picture, canvas, svg { max-width:100%!important; }
      video[aria-label="Town Square promotional explainer video"] {
        display:block!important; width:100%!important; height:auto!important;
        aspect-ratio:16/9!important; object-fit:cover!important;
      }
      #ts-preview-heading, .ts-preview-public-cta {
        display:block!important; width:100%!important; max-width:100%!important;
        padding-inline:.7rem!important; white-space:normal!important;
        overflow-wrap:anywhere!important; text-align:center!important;
        font-size:clamp(1.1rem,5.3vw,1.5rem)!important; line-height:1.05!important;
      }
      [aria-label="Business categories coming to the Town Square"] {
        display:flex!important; width:100%!important; max-width:100%!important;
        gap:.45rem!important; padding:.25rem .75rem .75rem!important;
        overflow-x:auto!important; overflow-y:hidden!important;
        overscroll-behavior-inline:contain!important; scrollbar-width:thin!important;
      }
      [aria-label="Business categories coming to the Town Square"]>* { flex:0 0 auto!important; }
      #ts-benefits-offer, #ts-benefits-offer.ts-offer-reordered {
        width:calc(100% - 2rem)!important; max-width:calc(100% - 2rem)!important;
        margin-inline:auto!important; padding:1rem!important;
      }
      #ts-benefits-offer *, .ts-why-intro-moved, .ts-why-intro-moved *,
      #ts-tenner-pricing *, #founding-access *, .ts-benefits-section li,
      .ts-benefits-section li * {
        max-width:100%!important; white-space:normal!important;
        overflow-wrap:anywhere!important; word-break:normal!important;
      }
      .ts-why-intro-moved {
        width:100%!important; padding-inline:1rem!important;
        font-size:clamp(1rem,4.5vw,1.18rem)!important; line-height:1.45!important;
        text-align:center!important;
      }
      .ts-benefits-section .ts-cta, #ts-steps-cta, #ts-tenner-pricing button {
        width:calc(100% - 2rem)!important; max-width:28rem!important;
        margin-inline:auto!important; padding-inline:.8rem!important;
        white-space:normal!important; overflow-wrap:anywhere!important;
      }
      .launch-stage { overflow:hidden!important; }
      .launch-stage>*, .launch-stage>*>* { min-width:0!important; max-width:100%!important; }
    }
  `;
  function protect() {
    var frame = document.querySelector('iframe[title="Lurgan Town Square"]');
    var page;
    try { page = frame && frame.contentDocument; } catch (error) { return; }
    if (!page || !page.head) return;
    var style = page.getElementById("ts-live-mobile-containment");
    if (!style) {
      style = page.createElement("style");
      style.id = "ts-live-mobile-containment";
      style.textContent = css;
    }
    page.head.appendChild(style);
  }
  var protectedVideos = new WeakSet();
  function protectVideo() {
    var frame = document.querySelector('iframe[title="Lurgan Town Square"]');
    var page;
    try { page = frame && frame.contentDocument; } catch (error) { return; }
    var video = page && page.querySelector('video[aria-label="Town Square promotional explainer video"]');
    if (!video || protectedVideos.has(video)) return;
    protectedVideos.add(video);
    var mediaPrototype = page.defaultView.HTMLMediaElement.prototype;
    var descriptor = Object.getOwnPropertyDescriptor(mediaPrototype, "src");
    if (descriptor && descriptor.get && descriptor.set) {
      Object.defineProperty(video, "src", {
        configurable: true,
        get: function () { return descriptor.get.call(this); },
        set: function (value) {
          if (descriptor.get.call(this) !== String(value)) descriptor.set.call(this, value);
        }
      });
    }
    if (video.getAttribute("src") !== source) video.setAttribute("src", source);
    video.setAttribute("poster", poster);
    video.setAttribute("preload", "none");
  }
  protect();
  var cascadeChecks = 0;
  var cascadeTimer = setInterval(function () {
    protect();
    if (++cascadeChecks >= 120) clearInterval(cascadeTimer);
  }, 250);
  protectVideo();
  var videoChecks = 0;
  var videoTimer = setInterval(function () {
    protectVideo();
    if (++videoChecks >= 80) clearInterval(videoTimer);
  }, 250);
})();
