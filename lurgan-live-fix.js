(function () {
  var attempts = 0;
  var timer = setInterval(function () {
    attempts += 1;
    var frame = document.querySelector('iframe[title="Lurgan Town Square"]');
    var page = frame && frame.contentDocument;
    if (!page) return;
    var video = page.querySelector('video[aria-label="Town Square promotional explainer video"]');
    if (video) {
      var source = "https://assets.cdn.filesafe.space/gtT3V5aXZHbJEfkqZpwi/media/6a97e1660ba3728cefccc5d2.mp4";
      var poster = "https://cdn.jsdelivr.net/gh/themarketingguyni-hue/lurgan-town-square-assets@main/lurgan-coming-soon-vsl-poster.png";
      if (video.getAttribute("src") !== source) video.setAttribute("src", source);
      video.setAttribute("poster", poster);
      video.setAttribute("preload", "metadata");
    }
    if (video || attempts >= 100) clearInterval(timer);
  }, 100);
})();
