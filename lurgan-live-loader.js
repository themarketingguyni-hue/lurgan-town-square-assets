(function () {
  fetch("https://cdn.jsdelivr.net/gh/themarketingguyni-hue/lurgan-town-square-assets@c26692b/lurgan-coming-soon.html")
    .then(function (response) {
      if (!response.ok) throw new Error("Unable to load the Lurgan Town Square page");
      return response.text();
    })
    .then(function (html) {
      document.open();
      document.write(html);
      document.close();
    })
    .catch(function (error) {
      console.error(error);
    });
})();
