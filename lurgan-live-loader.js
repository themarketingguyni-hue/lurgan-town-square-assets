(function () {
  document.documentElement.style.cssText = "margin:0;width:100%;height:100%;overflow:hidden";
  document.body.style.cssText = "margin:0;width:100%;height:100%;overflow:hidden";
  var page = document.createElement("iframe");
  page.title = "Lurgan Town Square live page";
  page.src = "https://cdn.jsdelivr.net/gh/themarketingguyni-hue/lurgan-town-square-assets@c26692b/lurgan-coming-soon.html";
  page.style.cssText = "display:block;width:100%;height:100%;border:0;background:#f8f4ea";
  document.body.replaceChildren(page);
})();
