(function () {
  var launchCountdownTimer = 0;
  var launchCountdownPage = null;
  var loadingGuard = document.createElement("style");
  loadingGuard.id = "ts-preview-loading-guard";
  loadingGuard.textContent = 'iframe[title="Lurgan Town Square"]{visibility:hidden!important}iframe[title="Lurgan Town Square"].ts-upgrade-ready{visibility:visible!important}';
  document.head.appendChild(loadingGuard);

  function closeLocalPreview(page) {
    var dialog = page.getElementById("ts-local-plot-preview");
    if (dialog) dialog.remove();
    page.body.style.overflow = "";
  }

  function addGoldShape(page, section, id) {
    if (!section) return;
    section.classList.add("ts-has-gold-shape");
    var divider = page.getElementById(id);
    if (!divider) {
      divider = page.createElement("div");
      divider.id = id;
      divider.className = "ts-inline-gold-shape";
      divider.setAttribute("aria-hidden", "true");
      divider.innerHTML = "<span></span>";
    }
    if (section.firstElementChild !== divider) section.prepend(divider);
  }

  function ensureLaunchCountdown(page) {
    if (launchCountdownPage === page && launchCountdownTimer) return;
    if (launchCountdownTimer && launchCountdownPage && launchCountdownPage.defaultView) launchCountdownPage.defaultView.clearInterval(launchCountdownTimer);
    launchCountdownPage = page;
    if (page.__tsCountdownRemovalObserver) {
      page.__tsCountdownRemovalObserver.disconnect();
      page.__tsCountdownRemovalObserver = null;
    }
    var launchTime = new Date("2026-09-16T09:00:00+01:00").getTime();
    function updateCountdown() {
      var heroCountdown = page.getElementById("ts-hero-countdown");
      if (heroCountdown) heroCountdown.remove();
      var header = page.querySelector(".ts-header, main > header, main header, header");
      if (!header) return;
      header.classList.add("ts-header");
      var countdown = header.querySelector(".ts-count");
      if (!countdown) {
        var headerInner = header.firstElementChild || header;
        countdown = Array.from(headerInner.children).find(function (element) {
          return element.textContent.replace(/\s+/g, " ").trim().toUpperCase().indexOf("LAUNCHING IN") !== -1;
        });
        if (!countdown) {
          countdown = page.createElement("div");
          headerInner.appendChild(countdown);
        }
        countdown.classList.add("ts-count");
      }
      countdown.style.setProperty("display", "grid", "important");
      var remaining = Math.max(0, launchTime - Date.now());
      var days = Math.floor(remaining / 86400000);
      var hours = Math.floor(remaining / 3600000) % 24;
      var minutes = Math.floor(remaining / 60000) % 60;
      var seconds = Math.floor(remaining / 1000) % 60;
      countdown.setAttribute("aria-label", days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds until launch");
      countdown.innerHTML = '<span class="ts-header-countdown-label">Launching in</span><span class="ts-header-countdown-time"><b><strong>' + days + '</strong><small>days</small></b><b><strong>' + String(hours).padStart(2, "0") + '</strong><small>hrs</small></b><b><strong>' + String(minutes).padStart(2, "0") + '</strong><small>min</small></b><b><strong>' + String(seconds).padStart(2, "0") + '</strong><small>sec</small></b></span>';
    }
    updateCountdown();
    launchCountdownTimer = page.defaultView.setInterval(updateCountdown, 1000);
  }

  function ensureTownSquareFilters(page, stage) {
    if (!stage) return;
    var filters = stage.querySelector('[aria-label="Business categories coming to the Town Square"]');
    if (!filters || filters.dataset.tsFiltersBound) return;
    filters.dataset.tsFiltersBound = "true";
    var controls = Array.from(filters.querySelectorAll('button, [role="checkbox"]'));
    function applyFilter(selected) {
      var label = selected.textContent.replace(/\s+/g, " ").trim();
      var showAll = /^All\b/i.test(label);
      controls.forEach(function (control) {
        var active = control === selected;
        control.setAttribute("aria-checked", active ? "true" : "false");
        control.classList.toggle("ts-filter-active", active);
      });
      Array.from(stage.querySelectorAll('button[aria-label^="Preview"]')).forEach(function (plot) {
        var description = plot.getAttribute("aria-label") || "";
        var plotCategory = /featured centre/i.test(description) ? "Professional" : description;
        var visible = showAll || plotCategory.toLowerCase().indexOf(label.toLowerCase()) !== -1;
        plot.hidden = false;
        plot.style.removeProperty("display");
        plot.classList.toggle("ts-filter-match", visible);
        plot.classList.toggle("ts-filter-dimmed", !visible);
      });
    }
    filters.addEventListener("click", function (event) {
      var selected = event.target && event.target.closest && event.target.closest('button, [role="checkbox"]');
      if (!selected || !filters.contains(selected)) return;
      event.preventDefault();
      applyFilter(selected);
    });
    var initial = controls.find(function (control) { return control.getAttribute("aria-checked") === "true"; }) || controls[0];
    if (initial) applyFilter(initial);
  }

  function openLocalPreview(page, button) {
    closeLocalPreview(page);
    var label = button.getAttribute("aria-label") || "Preview a Town Square plot";
    var plotMatch = label.match(/plot\s+(\d+)/i);
    var plot = plotMatch ? plotMatch[1] : "Featured";
    var categoryMatch = label.match(/(?:Preview(?: the larger)?\s+)(.+?)(?:\s+Town Square|\s+plot)/i);
    var category = categoryMatch ? categoryMatch[1] : "Local business";
    var profileKey = category.toLowerCase();
    var profile = profileKey.indexOf("food") !== -1
      ? { name: "The Copper Kettle Café", photo: "/businesses/ai-shopfronts/lurgan-cafe.png" }
      : profileKey.indexOf("beauty") !== -1 || profileKey.indexOf("health") !== -1
        ? { name: "Willow & Sage", photo: "/businesses/ai-shopfronts/lurgan-beauty.png" }
        : profileKey.indexOf("shop") !== -1
          ? { name: "Little Lantern Gifts", photo: "/businesses/ai-shopfronts/lurgan-gifts.png" }
          : profileKey.indexOf("trade") !== -1
            ? { name: "Oak & Iron Joinery", photo: "/businesses/ai-shopfronts/lurgan-joinery.png" }
            : profileKey.indexOf("professional") !== -1
              ? { name: "High Street Accounts", photo: "/businesses/ai-shopfronts/lurgan-accountancy.png" }
              : { name: "Market Street Studio", photo: "/businesses/ai-shopfronts/lurgan-gifts.png" };
    var dialog = page.createElement("div");
    dialog.id = "ts-local-plot-preview";
    dialog.className = "ts-local-preview";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "ts-local-preview-title");
    dialog.innerHTML = '<button class="ts-local-preview-backdrop" type="button" aria-label="Close plot preview"></button><aside><button class="ts-local-preview-close" type="button" aria-label="Close plot preview">×</button><div class="ts-local-preview-photo"><img class="ts-shopfront-photo" src="' + profile.photo + '" alt="Example Northern Ireland-style shopfront for ' + profile.name + '"><span>Example Local Business</span><b class="ts-business-logo" aria-label="Example logo position">Your<br>Logo<br>Here</b><strong>' + profile.name + '</strong></div><div class="ts-local-preview-content"><small>Lurgan · Plot #' + plot + ' · ' + category + '</small><h2 id="ts-local-preview-title">' + profile.name + '</h2><div class="ts-local-preview-rating"><b>4.9</b> <span>★★★★★</span> Customer reviews</div><p>Customers can discover your photographs, business story, reviews, website, telephone number and social links—all from your numbered plot.</p><div class="ts-local-preview-links"><b>Your website</b><b>Your phone number</b></div><div class="ts-local-preview-socials" aria-label="Example business social links"><button type="button" data-action="share" aria-label="Share this business"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg><span>Share</span></button><button type="button" aria-label="View Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.4 21v-8h2.8l.4-3.2h-3.2V7.7c0-.9.3-1.6 1.7-1.6H18V3.2c-.3 0-1.4-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2.3H8V13h3v8z"/></svg><span>Facebook</span></button><button type="button" aria-label="View Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.7" r="1" class="ts-icon-fill"/></svg><span>Instagram</span></button><button type="button" aria-label="View TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3v11.1a4.6 4.6 0 1 1-4-4.55v3.1a1.65 1.65 0 1 0 1 1.5V3h3Zm0 0c.35 2.2 1.7 3.7 4 4.2v3.1c-1.5-.1-2.8-.55-4-1.35"/></svg><span>TikTok</span></button></div><button class="ts-local-preview-join" type="button">Join the Lurgan waitlist</button><em>Be first to hear when plots become available.</em></div></aside>';
    page.body.appendChild(dialog);
    page.body.style.overflow = "hidden";
    dialog.querySelectorAll(".ts-local-preview-backdrop, .ts-local-preview-close").forEach(function (control) {
      control.addEventListener("click", function () { closeLocalPreview(page); });
    });
    dialog.querySelector(".ts-local-preview-join").addEventListener("click", function () {
      closeLocalPreview(page);
      var form = page.getElementById("founding-access");
      if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    dialog.querySelectorAll(".ts-local-preview-socials button").forEach(function (control) {
      control.addEventListener("click", function () {
        if (control.dataset.action === "share" && navigator.share) {
          navigator.share({ title: profile.name, text: "Example Lurgan Town Square business profile" }).catch(function () {});
        }
      });
    });
    dialog.querySelector(".ts-local-preview-close").focus();
  }

  function upgradeLurganPage() {
    var frame = document.querySelector('iframe[title="Lurgan Town Square"]');
    var page = frame && frame.contentDocument ? frame.contentDocument : document;
    var headerBrand = page.querySelector('.ts-brand, main header a[aria-label*="Town Square"], header a[aria-label*="Town Square"]');
    if (headerBrand) {
      headerBrand.classList.add("ts-brand");
      var headerBrandText = headerBrand.lastElementChild;
      if (headerBrandText && !headerBrandText.classList.contains("ts-mark")) headerBrandText.textContent = "Lurgan Town Square";
      headerBrand.setAttribute("aria-label", "Lurgan Town Square home");
    }
    ensureLaunchCountdown(page);
    var promoVideo = page.querySelector('video[aria-label="Town Square promotional explainer video"]');
    if (promoVideo) {
      promoVideo.setAttribute("poster", "/video/lurgan-coming-soon-vsl-poster.png");
      promoVideo.setAttribute("preload", "auto");
      if (promoVideo.getAttribute("src") !== "/video/lurgan-coming-soon-vsl.mp4") {
        promoVideo.setAttribute("src", "/video/lurgan-coming-soon-vsl.mp4");
        promoVideo.load();
      }
    }
    if (!page.__tsLocalPreviewEvents) {
      page.__tsLocalPreviewEvents = true;
      page.addEventListener("click", function (event) {
        var target = event.target && event.target.closest && event.target.closest('button[aria-label^="Preview"]');
        if (!target) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        openLocalPreview(page, target);
      }, true);
      page.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeLocalPreview(page);
      });
    }
    var businessHeading = page.getElementById("business-types-title");
    var businessPanel = businessHeading && businessHeading.closest("section");
    if (businessPanel) businessPanel.classList.add("ts-businesses", "ts-dominant-businesses");
    var benefitsHeading = page.getElementById("business-benefits-title");
    var benefitsSection = benefitsHeading && benefitsHeading.closest("section");
    if (benefitsSection) {
      var benefitsList = benefitsSection.querySelector("ul");
      if (benefitsList) {
        benefitsList.classList.add("ts-benefits-list");
        benefitsList.innerHTML = '<li><strong>✓ Get discovered by new customers</strong> searching for services and shops right here in Lurgan.</li><li><strong>✓ Your own business profile</strong> Bring your logo, real photos, story, reviews and direct links together in one easy-to-find place.</li><li><strong>✓ Turn interest into enquiries</strong> Send customers straight to your website, phone number and social pages.</li><li><strong>✓ Help your website rank higher</strong> on Google with a clean, categorised local profile built for local SEO.</li><li><strong>✓ Free promotion across the town</strong> through local Facebook groups, community social channels, and public spotlights.</li><li><strong>✓ Feature in local email lists</strong> sent directly to customers looking for news, updates, and local offers.</li><li><strong>✓ Claim your spot on the main Square</strong> with a high-visibility spotlight feature.</li><li><strong>✓ Build your presence early</strong> and get established before the official public launch.</li>';
      }
    }
    if (benefitsHeading) {
      benefitsHeading.innerHTML = '<span class="ts-heading-main">Make Your Business<span class="ts-mobile-heading-break"><br></span> Easier to Find.</span> <span class="ts-heading-accent">And Easier to Choose.</span>';
      var benefitsEyebrow = page.getElementById("ts-benefits-eyebrow");
      if (!benefitsEyebrow) {
        benefitsEyebrow = page.createElement("p");
        benefitsEyebrow.id = "ts-benefits-eyebrow";
      }
      benefitsEyebrow.textContent = "Inside Lurgan’s Town Square";
      benefitsHeading.before(benefitsEyebrow);
    }
    if (benefitsHeading && !page.getElementById("ts-benefits-subheading")) {
      var benefitsSubheading = page.createElement("p");
      benefitsSubheading.id = "ts-benefits-subheading";
      benefitsSubheading.textContent = "Here’s What You Get";
      benefitsHeading.after(benefitsSubheading);
    }
    var benefitsSubheading = page.getElementById("ts-benefits-subheading");
    if (benefitsSubheading) benefitsSubheading.textContent = "Here’s What You Get";
    if (benefitsSection) {
      benefitsSection.classList.add("ts-benefits-section");
      var oldBenefitsShape = page.getElementById("ts-benefits-gold-shape");
      if (oldBenefitsShape) oldBenefitsShape.remove();
      benefitsSection.classList.remove("ts-has-gold-shape");
    }
    var localFeatureGrid = page.querySelector(".ts-why-grid");
    if (localFeatureGrid) {
      localFeatureGrid.classList.add("ts-why-vertical");
      localFeatureGrid.style.setProperty("display", "grid", "important");
      localFeatureGrid.style.setProperty("grid-template-columns", "minmax(0, 1fr)", "important");
      Array.from(localFeatureGrid.children).forEach(function (item) {
        item.style.setProperty("width", "100%", "important");
        item.style.setProperty("border-right", "0", "important");
      });
    }

    var launchTitle = page.getElementById("launch-title");
    if (launchTitle && !launchTitle.querySelector(".ts-title-place")) {
      launchTitle.setAttribute("aria-label", "Lurgan Town Square. Launching soon.");
      launchTitle.innerHTML = '<span class="ts-title-place">Lurgan Town<span class="ts-square-word">Square</span></span><span class="ts-title-launch">Launching soon.</span>';
    }

    var heroStats = page.querySelectorAll(".ts-hero-stats");
    heroStats.forEach(function (row) {
      if (!row.classList.contains("ts-hero-message")) {
        row.classList.add("ts-hero-message");
        row.innerHTML = '<span class="ts-hero-message-title">Built for Lurgan’s best businesses.</span><span class="ts-hero-message-stats"><b><strong>9,400</strong><span>nearby businesses</span></b><b><strong>Only 100</strong><span>Town&nbsp;Square plots</span></b></span>';
      }
      row.classList.add("ts-global-sticky");
    });
    var pageHeader = page.querySelector("main header");
    if (pageHeader && heroStats.length) pageHeader.after.apply(pageHeader, Array.from(heroStats));
    var heroSubhead = Array.from(page.querySelectorAll("p, .ts-hero-subhead")).find(function (copy) {
      var text = copy.textContent.replace(/\s+/g, " ").trim().toUpperCase();
      return text.indexOf("ADVERTISE YOUR BUSINESS LOCALLY") === 0 || text.indexOf("DIGITAL TOWN SQUARE") !== -1;
    });
    Array.from(page.querySelectorAll("p, .ts-hero-subhead")).forEach(function (copy) {
      if (copy.textContent.replace(/\s+/g, " ").trim().toUpperCase().indexOf("ADVERTISE YOUR BUSINESS LOCALLY") === 0) {
        copy.textContent = "Advertise your business locally, get seen by more local customers and build a searchable profile to support your SEO.";
      }
    });
    Array.from(page.querySelectorAll("p, span, div")).forEach(function (element) {
      if (element.textContent.replace(/\s+/g, " ").trim() === "Your final quote and availability will be confirmed personally.") {
        element.classList.add("ts-white-confirmation-note");
        if (element.parentElement) element.parentElement.classList.add("ts-white-confirmation-background");
      }
    });
    var heroFrame = page.getElementById("ts-hero-frame");
    var vslSection = page.getElementById("ts-hero-video-section");
    var firstWaitlistCta = Array.from(page.querySelectorAll("button, a")).find(function (control) {
      var copy = control.textContent.replace(/\s+/g, " ").trim().toUpperCase();
      return copy.indexOf("JOIN THE LURGAN") === 0 && copy.indexOf("TOWN SQUARE WAITLIST") !== -1;
    });
    var finalBenefit = benefitsSection && Array.from(benefitsSection.querySelectorAll("li, div, p")).find(function (item) {
      return item.textContent.replace(/\s+/g, " ").trim().toUpperCase().indexOf("BUILD AN ESTABLISHED LOCAL PRESENCE BEFORE THE PUBLIC LAUNCH") !== -1;
    });
    var benefitList = finalBenefit;
    while (benefitList && benefitList.parentElement !== benefitsSection) benefitList = benefitList.parentElement;
    if (benefitList) benefitList.classList.add("ts-benefits-list");
    if (firstWaitlistCta && benefitList && benefitList.nextElementSibling !== firstWaitlistCta) {
      benefitList.after(firstWaitlistCta);
      firstWaitlistCta.classList.add("ts-vsl-cta", "ts-reference-cta", "ts-benefits-cta");
    }
    if (firstWaitlistCta) {
      firstWaitlistCta.textContent = "👉 Claim Your Spot On The Waitlist";
      firstWaitlistCta.setAttribute("aria-label", "Claim your spot on the waitlist");
    }
    var benefitsPrice = page.getElementById("ts-benefits-price");
    if (benefitsPrice) benefitsPrice.remove();
    if (businessHeading && !businessHeading.classList.contains("ts-business-count-heading")) {
      businessHeading.classList.add("ts-business-count-heading");
      businessHeading.innerHTML = '<span>9,400 nearby businesses.</span><span>Only 100 Town&nbsp;Square plots.</span>';
    }
    if (businessPanel) businessPanel.classList.remove("ts-businesses-copy-only");

    var townSquareStage = page.querySelector(".launch-stage");
    ensureTownSquareFilters(page, townSquareStage);
    if (townSquareStage) {
      Array.from(townSquareStage.querySelectorAll("button")).forEach(function (plot) {
        if (!/^Preview/i.test(plot.getAttribute("aria-label") || "")) return;
        var walker = page.createTreeWalker(plot, NodeFilter.SHOW_TEXT);
        var words = [];
        var textNode;
        while ((textNode = walker.nextNode())) {
          if (textNode.nodeValue.trim()) words.push(textNode);
        }
        for (var wordIndex = 0; wordIndex <= words.length - 3; wordIndex += 1) {
          if (words[wordIndex].nodeValue.trim().toUpperCase() === "YOUR" &&
              words[wordIndex + 1].nodeValue.trim().toUpperCase() === "BUSINESS" &&
              words[wordIndex + 2].nodeValue.trim().toUpperCase() === "HERE") {
            words[wordIndex].nodeValue = words[wordIndex].nodeValue.replace(/YOUR/i, "CLAIM");
            words[wordIndex + 1].nodeValue = words[wordIndex + 1].nodeValue.replace(/BUSINESS/i, "YOUR");
            words[wordIndex + 2].nodeValue = words[wordIndex + 2].nodeValue.replace(/HERE/i, "PLOT");
            break;
          }
        }
      });
    }
    if (heroFrame) heroFrame.style.setProperty("order", "0", "important");
    if (townSquareStage) {
      townSquareStage.style.setProperty("order", "2", "important");
      townSquareStage.style.setProperty("margin-bottom", "clamp(2rem, 4vw, 3.25rem)", "important");
      townSquareStage.style.setProperty("padding-bottom", "0", "important");
      var oldStageShape = page.getElementById("ts-town-square-gold-shape");
      if (oldStageShape) oldStageShape.remove();
      var heroSquareDivider = page.getElementById("ts-hero-square-transition");
      if (!heroSquareDivider) {
        heroSquareDivider = page.createElement("div");
        heroSquareDivider.id = "ts-hero-square-transition";
        heroSquareDivider.setAttribute("aria-hidden", "true");
        heroSquareDivider.innerHTML = "<span></span>";
      }
      heroSquareDivider.style.setProperty("order", "1", "important");
      if (heroFrame && heroFrame.nextElementSibling !== heroSquareDivider) heroFrame.after(heroSquareDivider);
      if (heroSquareDivider.nextElementSibling !== townSquareStage) heroSquareDivider.after(townSquareStage);
      if (heroFrame && heroFrame.parentElement) {
        Array.from(heroFrame.parentElement.children).forEach(function (section) {
          if (section !== heroSquareDivider && !section.textContent.trim() && section.getBoundingClientRect().height === 0) {
            section.style.setProperty("margin-top", "0", "important");
            section.style.setProperty("margin-bottom", "0", "important");
          }
        });
      }
    }
    var customerBenefits = page.getElementById("ts-customer-discoveries");
    if (customerBenefits) customerBenefits.remove();
    customerBenefits = null;
    if (benefitsSection) {
      benefitsSection.style.setProperty("order", "4", "important");
      benefitsSection.style.setProperty("margin-bottom", "0", "important");
    }
    var squareBenefitsDivider = page.getElementById("ts-square-benefits-transition");
    if (!squareBenefitsDivider && townSquareStage && benefitsSection) {
      squareBenefitsDivider = page.createElement("div");
      squareBenefitsDivider.id = "ts-square-benefits-transition";
      squareBenefitsDivider.setAttribute("aria-hidden", "true");
      squareBenefitsDivider.innerHTML = "<span></span>";
    }
    if (squareBenefitsDivider) squareBenefitsDivider.style.setProperty("order", "3", "important");
    if (townSquareStage && squareBenefitsDivider && townSquareStage.nextElementSibling !== squareBenefitsDivider) {
      townSquareStage.after(squareBenefitsDivider);
    }
    if (squareBenefitsDivider && benefitsSection && squareBenefitsDivider.nextElementSibling !== benefitsSection) {
      squareBenefitsDivider.after(benefitsSection);
    }

    var stepsHeading = Array.from(page.querySelectorAll("h2")).find(function (heading) {
      var text = heading.textContent.replace(/\s+/g, " ").trim().toUpperCase();
      return text.indexOf("YOUR BUSINESS ON") !== -1 && text.indexOf("TOWN SQUARE") !== -1 && text.indexOf("3 SIMPLE STEPS") !== -1;
    });
    if (stepsHeading) stepsHeading.textContent = "Your Business on Lurgan Town Square in 3 simple steps.";
    var stepsSection = stepsHeading && (stepsHeading.closest("section") || stepsHeading.parentElement);
    if (stepsSection) {
      stepsSection.classList.add("ts-steps-section-clean");
      stepsSection.style.setProperty("order", "7", "important");
      stepsSection.style.setProperty("margin-top", "0", "important");
      stepsSection.style.setProperty("margin-bottom", "0", "important");
      stepsSection.style.setProperty("background", "#fffdf7", "important");
      var stepsHeadingLayer = stepsHeading.parentElement;
      while (stepsHeadingLayer && stepsHeadingLayer !== stepsSection) {
        stepsHeadingLayer.classList.add("ts-steps-heading-layer");
        stepsHeadingLayer.style.setProperty("background", "#fffdf7", "important");
        stepsHeadingLayer = stepsHeadingLayer.parentElement;
      }
      var stepsCta = page.getElementById("ts-steps-cta");
      if (!stepsCta) {
        stepsCta = page.createElement("button");
        stepsCta.id = "ts-steps-cta";
        stepsCta.type = "button";
        stepsCta.textContent = "👉 Claim Your Spot On The Waitlist";
        stepsCta.addEventListener("click", function () {
          page.getElementById("founding-access")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      stepsSection.appendChild(stepsCta);
    }
    var stepsGoldShape = page.getElementById("ts-steps-gold-shape");
    if (stepsGoldShape) stepsGoldShape.remove();
    if (stepsSection) stepsSection.classList.remove("ts-has-gold-shape");
    var sectionDivider = page.getElementById("ts-town-square-divider");
    if (sectionDivider) sectionDivider.remove();

    var previewHeading = page.getElementById("ts-preview-heading");
    var publicWaitlistCta = Array.from(page.querySelectorAll("button, a")).find(function (control) {
      var copy = control.textContent.replace(/\s+/g, " ").trim().toUpperCase();
      return copy.indexOf("LURGAN'S PUBLIC TOWN SQUARE") !== -1 && copy.indexOf("JOIN THE WAIT LIST") !== -1;
    });
    if (previewHeading && publicWaitlistCta && previewHeading !== publicWaitlistCta) {
      previewHeading.replaceWith(publicWaitlistCta);
      publicWaitlistCta.id = "ts-preview-heading";
      publicWaitlistCta.classList.add("ts-preview-public-cta");
    }
    var previewPublicCta = page.querySelector(".ts-preview-public-cta");
    if (previewPublicCta) {
      previewPublicCta.textContent = "Lurgan’s Best Businesses in One Place";
      previewPublicCta.setAttribute("aria-label", "Lurgan’s best businesses in one place");
      var squareHighlights = page.getElementById("ts-square-highlights");
      if (squareHighlights) squareHighlights.remove();
    }

    var benefitsOffer = page.getElementById("ts-benefits-offer");
    if (benefitsOffer) benefitsOffer.remove();
    var advertiseCallout = page.getElementById("ts-advertise-callout");
    if (heroSubhead && launchTitle && heroSubhead.previousElementSibling !== launchTitle) {
      launchTitle.after(heroSubhead);
      heroSubhead.classList.remove("ts-advertise-callout-copy");
    }
    var countdownElement = page.getElementById("ts-countdown");
    if (launchTitle && countdownElement) {
      Array.from(page.querySelectorAll(".ts-count > small")).forEach(function (element) {
        if (!element.closest("#ts-hero-countdown")) element.remove();
      });
      var launchLabel = Array.from(page.querySelectorAll("p, span, div")).find(function (element) {
        return element.textContent.replace(/\s+/g, " ").trim().toUpperCase() === "LAUNCHING IN" && !element.children.length;
      });
      if (!launchLabel) {
        launchLabel = page.createElement("span");
        launchLabel.textContent = "Launching in";
      }
      var originalCountdownParent = countdownElement.parentElement;
      var heroCountdown = page.getElementById("ts-hero-countdown");
      if (!heroCountdown) {
        heroCountdown = page.createElement("div");
        heroCountdown.id = "ts-hero-countdown";
        heroCountdown.setAttribute("aria-label", "Countdown to launch");
      }
      launchTitle.before(heroCountdown);
      if (launchLabel) {
        launchLabel.classList.add("ts-hero-countdown-label");
        heroCountdown.appendChild(launchLabel);
      }
      countdownElement.classList.add("ts-hero-countdown-time");
      heroCountdown.appendChild(countdownElement);
      Array.from(page.querySelectorAll("p, span, div, small")).forEach(function (element) {
        if (!heroCountdown.contains(element) && !element.children.length && element.textContent.replace(/\s+/g, " ").trim().toUpperCase().indexOf("LAUNCHING IN") !== -1) {
          element.remove();
        }
      });
      if (originalCountdownParent && originalCountdownParent !== heroCountdown && !originalCountdownParent.textContent.trim()) {
        originalCountdownParent.classList.add("ts-empty-countdown-slot");
      }
    }
    if (advertiseCallout) advertiseCallout.remove();

    page.getElementById("ts-hero-main-cta")?.remove();
    page.getElementById("ts-hero-offer")?.remove();

    if (benefitsSection) {
      [
        "MORE WAYS FOR LURGAN TO DISCOVER YOU",
        "GET FEATURED AS A LOCAL RECOMMENDED BUSINESS TO VISIT INSIDE LURGAN'S PUBLIC TOWN SQUARE.",
        "REACH LOCAL CUSTOMERS THROUGH LURGAN TOWN SQUARE EMAIL UPDATES.",
        "BE PART OF THE LURGAN TOWN SQUARE FACEBOOK COMMUNITY GROUP."
      ].forEach(function (wanted) {
        var match = Array.from(benefitsSection.querySelectorAll("div, p, span")).find(function (element) {
          return element.textContent.replace(/\s+/g, " ").trim().toUpperCase() === wanted;
        });
        if (!match) return;
        while (match.parentElement && match.parentElement !== benefitsSection) match = match.parentElement;
        match.remove();
      });
    }

    var whyHeading = page.getElementById("why-town-square-title");
    var whySection = whyHeading && (whyHeading.closest("section") || whyHeading.parentElement);
    if (whySection) {
      Array.from(page.querySelectorAll("div.order-5.mb-12.max-w-6xl")).forEach(function (spacer) {
        if (!spacer.textContent.trim()) spacer.remove();
      });
      var benefitsSpacer = benefitsSection && benefitsSection.nextElementSibling;
      if (benefitsSpacer && benefitsSpacer !== whySection && !benefitsSpacer.textContent.trim()) {
        benefitsSpacer.remove();
      }
      if (benefitsSection && whySection) {
        var betweenBenefitsAndWhy = benefitsSection.nextElementSibling;
        while (betweenBenefitsAndWhy && betweenBenefitsAndWhy !== whySection) {
          var nextBetweenSection = betweenBenefitsAndWhy.nextElementSibling;
          if (!betweenBenefitsAndWhy.textContent.trim()) betweenBenefitsAndWhy.remove();
          betweenBenefitsAndWhy = nextBetweenSection;
        }
      }
      whyHeading.innerHTML = 'More Visibility for <span class="ts-why-heading-accent">Local Businesses</span>.';
      whySection.classList.add("ts-why-white-section");
      whySection.style.setProperty("margin-top", "0", "important");
      whySection.style.setProperty("margin-bottom", "0", "important");
      var whyIntro = Array.from(whySection.querySelectorAll("p, div")).find(function (element) {
        return element.textContent.replace(/\s+/g, " ").trim().indexOf("Lurgan Town Square brings local businesses") === 0 && !element.querySelector("p, div");
      });
      if (whyIntro) {
        var oldIntroPanel = whyIntro.parentElement;
        whyIntro.classList.add("ts-why-intro-moved");
        whyHeading.after(whyIntro);
        if (whyHeading.parentElement && whyHeading.parentElement.parentElement) whyHeading.parentElement.parentElement.classList.add("ts-why-heading-unified");
        if (oldIntroPanel && oldIntroPanel !== whyHeading.parentElement && !oldIntroPanel.textContent.trim()) oldIntroPanel.remove();
      }
      var whyArticles = whySection.querySelectorAll("article");
      if (whyArticles.length) {
        var whyList = whyArticles[0].parentElement;
        whyList.classList.add("ts-why-grid", "ts-why-vertical");
      }
    }
    addGoldShape(page, whySection, "ts-why-gold-shape");
    var tennerSection = page.getElementById("ts-tenner-pricing");
    if (!tennerSection) {
      tennerSection = page.createElement("section");
      tennerSection.id = "ts-tenner-pricing";
      tennerSection.classList.add("ts-has-gold-shape");
      tennerSection.setAttribute("aria-labelledby", "ts-tenner-title");
      tennerSection.innerHTML = '<div class="ts-tenner-inner"><header><p>Lurgan Town Square</p><h2 id="ts-tenner-title">Claim Your Plot</h2></header><div class="ts-tenner-copy"><div class="ts-tenner-rates"><p><span class="ts-tenner-number">01</span><span>First <strong class="ts-free-five">5 approved businesses</strong> advertise <strong>FREE</strong> for 12 months.</span></p><p><span class="ts-tenner-number">02</span><span>After that, claim your Lurgan Town Square plot <strong>from only £10 per year</strong>.</span></p></div><div class="ts-pricing-reminder"><h3>Quick Recap on What You Get:</h3><ul><li><strong>Get Found Locally:</strong> Show up when people in Lurgan search for the service, shop or trade you provide.</li><li><strong>Your Business, Properly Presented:</strong> Bring your logo, photos, story, reviews and links together in one easy-to-find profile.</li><li><strong>Turn Views Into Enquiries:</strong> Send customers straight to your website, phone number and social pages.</li><li><strong>More Visibility, On and Off Google:</strong> Support your local SEO and get promoted through local social channels, email updates and spotlights.</li></ul></div><button class="ts-tenner-cta" type="button">👉 Claim Your Spot On The Waitlist</button></div></div>';
      tennerSection.querySelector(".ts-tenner-cta").addEventListener("click", function () {
        page.getElementById("founding-access")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    tennerSection.style.order = "6";
    tennerSection.querySelectorAll(".ts-tenner-number").forEach(function (number) { number.remove(); });
    addGoldShape(page, tennerSection, "ts-tenner-gold-shape");
    if (whySection && whySection.nextElementSibling !== tennerSection) {
      whySection.after(tennerSection);
    } else if (!whySection && businessPanel && businessPanel.previousElementSibling !== tennerSection) {
      businessPanel.before(tennerSection);
    }
    if (businessPanel) businessPanel.style.order = "8";
    if (businessPanel) {
      businessPanel.style.setProperty("margin-top", "0", "important");
      businessPanel.style.setProperty("margin-bottom", "0", "important");
    }
    if (businessPanel && !page.getElementById("ts-who-title")) {
      var whoTitle = page.createElement("h2");
      whoTitle.id = "ts-who-title";
      whoTitle.textContent = "Who Is This For?";
      businessPanel.prepend(whoTitle);
    }
    if (stepsSection && tennerSection.nextElementSibling !== stepsSection) tennerSection.after(stepsSection);
    if (businessPanel && stepsSection && stepsSection.nextElementSibling !== businessPanel) stepsSection.after(businessPanel);
    else if (businessPanel && !stepsSection && tennerSection.nextElementSibling !== businessPanel) tennerSection.after(businessPanel);

    var optin = page.getElementById("founding-access");
    if (optin) {
      optin.classList.add("ts-business-optin");
      if (businessPanel && businessPanel.nextElementSibling !== optin) businessPanel.after(optin);
      var optinInner = optin.querySelector(".relative.z-10") || optin.querySelector(".town-ghl-form-wrap")?.parentElement;
      var optinIntro = page.getElementById("ts-business-optin-intro");
      if (!optinIntro) {
        optinIntro = page.createElement("header");
        optinIntro.id = "ts-business-optin-intro";
        optinIntro.innerHTML = '<p>Join the Waitlist</p><h2>Put Your Business on Lurgan Town Square</h2><span>Enter your details below to hear first when plots become available.</span>';
      }
      if (optinInner && optinInner.firstElementChild !== optinIntro) optinInner.prepend(optinIntro);
      var businessOptinForm = page.getElementById("ts-business-waitlist-form");
      if (!businessOptinForm) {
        businessOptinForm = page.createElement("form");
        businessOptinForm.id = "ts-business-waitlist-form";
        businessOptinForm.innerHTML = '<label><span>Business Name</span><input name="full_name" type="text" autocomplete="organization" placeholder="Enter your business name" required></label><label><span>Business Email</span><input name="email" type="email" autocomplete="email" placeholder="Enter your business email" required></label><button type="submit">Join the Waitlist</button><p class="ts-optin-status" role="status" aria-live="polite"></p>';
        businessOptinForm.addEventListener("submit", function (event) {
          event.preventDefault();
          var submitButton = businessOptinForm.querySelector("button");
          var status = businessOptinForm.querySelector(".ts-optin-status");
          var payload = new FormData(businessOptinForm);
          submitButton.disabled = true;
          submitButton.textContent = "Joining…";
          status.textContent = "";
          fetch("https://services.leadconnectorhq.com/forms/submit?formId=W4NlTsBtQQzJM46A9d0n&locationId=gtT3V5aXZHbJEfkqZpwi", {
            method: "POST",
            body: payload
          }).then(function (response) {
            if (!response.ok) throw new Error("Waitlist submission failed");
            businessOptinForm.reset();
            submitButton.textContent = "You’re on the Waitlist";
            status.textContent = "Thanks — we’ll be in touch when Lurgan Town Square plots become available.";
          }).catch(function () {
            submitButton.disabled = false;
            submitButton.textContent = "Join the Waitlist";
            status.textContent = "We couldn’t submit that just now. Please try again.";
          });
        });
      }
      if (optinIntro && optinIntro.nextElementSibling !== businessOptinForm) optinIntro.after(businessOptinForm);
      var ghlFormWrap = optin.querySelector(".town-ghl-form-wrap");
      if (ghlFormWrap) ghlFormWrap.classList.add("ts-original-ghl-form");
      function labelBusinessFields() {
        var formFrame = optin.querySelector("iframe");
        var formPage = null;
        try { formPage = formFrame && formFrame.contentDocument; } catch (error) {}
        if (!formPage) return false;
        var fields = Array.from(formPage.querySelectorAll("input"));
        var nameField = fields.find(function (field) {
          return field.type !== "hidden" && field.type !== "email" && /name/i.test((field.name || "") + " " + (field.placeholder || ""));
        });
        var emailField = fields.find(function (field) {
          return field.type === "email" || /email/i.test((field.name || "") + " " + (field.placeholder || ""));
        });
        [[nameField, "Business Name"], [emailField, "Business Email"]].forEach(function (entry) {
          var field = entry[0];
          var label = entry[1];
          if (!field) return;
          field.placeholder = label;
          field.setAttribute("aria-label", label);
          var fieldLabel = field.id && formPage.querySelector('label[for="' + field.id + '"]');
          if (!fieldLabel) fieldLabel = field.closest("div") && field.closest("div").querySelector("label");
          if (fieldLabel) fieldLabel.textContent = label + " *";
        });
        return !!(nameField && emailField);
      }
      labelBusinessFields();
      if (!optin.dataset.tsBusinessFields) {
        optin.dataset.tsBusinessFields = "true";
        var fieldChecks = 0;
        var fieldTimer = page.defaultView.setInterval(function () {
          fieldChecks += 1;
          if (labelBusinessFields() || fieldChecks >= 20) page.defaultView.clearInterval(fieldTimer);
        }, 400);
      }
      if (window.location.hash === "#founding-access" && !optin.dataset.tsDeepLinked) {
        optin.dataset.tsDeepLinked = "true";
        window.setTimeout(function () { optin.scrollIntoView({ block: "start" }); }, 350);
      }
    }

    var previewDialog = page.querySelector('[role="dialog"][aria-labelledby="plot-preview-title"]');
    if (previewDialog) {
      previewDialog.classList.add("ts-plot-preview-dialog");
      var previewDrawer = previewDialog.querySelector("aside");
      if (previewDrawer) previewDrawer.classList.add("ts-plot-preview-drawer");
    }

    var deepLinkTarget = window.location.hash && page.getElementById(window.location.hash.slice(1));
    if (deepLinkTarget && !deepLinkTarget.dataset.tsDeepLinked) {
      deepLinkTarget.dataset.tsDeepLinked = "true";
      window.setTimeout(function () { deepLinkTarget.scrollIntoView({ block: "start" }); }, 350);
    }

    if (page.getElementById("ts-dominant-style-upgrade")) {
      Array.from(page.querySelectorAll("button, a")).forEach(function (control) {
        if (control.textContent.toUpperCase().indexOf("JOIN THE LURGAN") !== -1) {
          control.classList.add("ts-reference-cta");
        }
      });
      return;
    }

    var style = page.createElement("style");
    style.id = "ts-dominant-style-upgrade";
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;0,900;1,700;1,800&display=swap');

      #launch-title,
      .ts-businesses h2,
      .ts-cta,
      #ts-video-cta,
      .ts-reference-cta,
      a[href="#founding-access"] {
        font-family: "Barlow Condensed", Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif !important;
        font-weight: 700 !important;
      }

      html body #launch-title {
        font-family: "Anton", Impact, sans-serif !important;
        font-weight: 400 !important;
        max-width: 68rem !important;
        font-size: clamp(3.6rem, 7.4vw, 7rem) !important;
        line-height: .82 !important;
        letter-spacing: -.04em !important;
      }

      html body #launch-title .ts-title-place,
      html body #launch-title .ts-title-launch {
        display: block !important;
        font-size: 1em !important;
        line-height: .82 !important;
        white-space: nowrap !important;
      }

      html body #launch-title .ts-square-word {
        margin-left: .18em;
      }

      html body section p:not(.ts-hero-stats),
      html body section li {
        font-weight: 650 !important;
      }

      html body .ts-hero-subhead {
        font-weight: 650 !important;
      }

      @media (min-width: 768px) {
        html body #launch-title {
          width: min(96vw, 88rem) !important;
          max-width: 88rem !important;
          font-size: clamp(4.75rem, 7.5vw, 9rem) !important;
          line-height: .79 !important;
        }
        html body .ts-hero-subhead {
          max-width: 72rem !important;
          font-size: clamp(1.75rem, 2.6vw, 3rem) !important;
          line-height: 1.12 !important;
        }
      }
      html body #ts-advertise-callout {
        order: 2;
        position: relative;
        width: min(calc(100% - 2rem), 72rem);
        margin: clamp(2.5rem, 6vw, 5.5rem) auto clamp(1.5rem, 4vw, 3rem);
        padding: clamp(2rem, 5vw, 4.25rem) clamp(1.25rem, 7vw, 6rem);
        border: 1px solid rgba(23,63,53,.2);
        border-left: clamp(.28rem, .7vw, .5rem) solid #e84724;
        background: rgba(255,253,247,.96);
        color: #173f35;
        overflow: hidden;
      }
      html body #ts-advertise-callout::after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: clamp(3.5rem, 9vw, 7rem);
        height: .35rem;
        background: #f0c75e;
      }
      html body #ts-advertise-callout .ts-advertise-callout-copy {
        position: relative;
        z-index: 1;
        max-width: 49rem !important;
        margin: 0 0 2rem !important;
        color: #173f35 !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(1.45rem, 3.1vw, 2.75rem) !important;
        font-weight: 650 !important;
        line-height: 1.16 !important;
        letter-spacing: -.025em;
        text-align: left !important;
        text-wrap: balance;
      }

      html body #ts-hero-frame {
        --ts-video-tail: clamp(3.5rem, 6vw, 4.75rem);
        width: 100vw !important;
        max-width: none !important;
        margin-top: 0 !important;
        margin-left: calc(50% - 50vw) !important;
        margin-right: calc(50% - 50vw) !important;
        margin-bottom: 0 !important;
        padding-top: clamp(2.75rem, 4vw, 4.25rem) !important;
        padding-bottom: var(--ts-video-tail) !important;
        overflow: hidden !important;
        border: 0 !important;
        border-radius: 0 !important;
        text-align: center !important;
      }
      html body section[aria-labelledby="launch-title"] {
        margin-top: 0 !important;
        padding-top: 0 !important;
        row-gap: 0 !important;
      }
      html body #ts-hero-frame > div:not(.town-street-frame) {
        width: 100% !important;
        max-width: 88rem !important;
        margin-inline: auto !important;
        text-align: center !important;
      }
      html body #ts-hero-frame #launch-title {
        position: relative !important;
        left: 50% !important;
        width: min(96vw, 88rem) !important;
        margin: 0 !important;
        transform: translateX(-50%) !important;
        text-align: center !important;
      }
      html body #ts-hero-frame .ts-hero-subhead {
        width: min(100%, 64rem) !important;
        margin: clamp(1.4rem, 2.5vw, 2.1rem) auto 0 !important;
        padding: 0 !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        text-align: center !important;
        text-wrap: balance;
      }
      html body .ts-empty-countdown-slot {
        display: none !important;
      }
      html body #ts-hero-countdown {
        display: none !important;
      }
      html body .ts-header .ts-count {
        display: grid !important;
        grid-template-columns: max-content max-content !important;
        align-items: center !important;
        gap: clamp(.7rem, 1.5vw, 1.15rem) !important;
        margin: 0 !important;
        color: #173f35 !important;
      }
      html body .ts-header .ts-header-countdown-label {
        display: inline-flex !important;
        align-items: center !important;
        gap: .45rem !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(.62rem, .85vw, .76rem) !important;
        font-weight: 800 !important;
        letter-spacing: .11em !important;
        line-height: 1 !important;
        text-transform: uppercase !important;
        white-space: nowrap !important;
      }
      html body .ts-header .ts-header-countdown-label::before {
        content: none !important;
        display: none !important;
      }
      html body .ts-header .ts-header-countdown-time {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(2.65rem, auto)) !important;
        align-items: center !important;
        gap: .25rem !important;
      }
      html body .ts-header .ts-header-countdown-time > b {
        display: grid !important;
        gap: .05rem !important;
        text-align: center !important;
      }
      html body .ts-header .ts-header-countdown-time strong {
        color: #e84724 !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(1.35rem, 1.8vw, 1.7rem) !important;
        font-weight: 800 !important;
        line-height: .85 !important;
      }
      html body .ts-header .ts-header-countdown-time small {
        color: #173f35 !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(.48rem, .58vw, .57rem) !important;
        font-weight: 700 !important;
        letter-spacing: .04em !important;
        line-height: 1 !important;
        text-transform: uppercase !important;
      }
      @media (max-width: 520px) {
        html body .ts-header .ts-count {
          grid-template-columns: minmax(0, 1fr) !important;
          justify-items: center !important;
          gap: .35rem !important;
        }
        html body .ts-header .ts-header-countdown-label {
          font-size: .58rem !important;
        }
        html body .ts-header .ts-header-countdown-time {
          grid-template-columns: repeat(4, minmax(2rem, auto)) !important;
          gap: .08rem !important;
        }
        html body .ts-header .ts-header-countdown-time strong {
          font-size: 1.2rem !important;
        }
      }
      html body .ts-header-launching-label {
        display: none !important;
      }
      html body #ts-hero-countdown {
        position: relative !important;
        z-index: 4 !important;
        display: inline-flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        gap: .45rem !important;
        width: min(calc(100% - 2rem), 26rem) !important;
        max-width: calc(100% - 2rem) !important;
        margin: .15rem auto clamp(1.35rem, 2.5vw, 1.8rem) !important;
        padding: .72rem clamp(.6rem, 1.5vw, .9rem) .34rem !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #173f35 !important;
      }
      html body #ts-hero-countdown .ts-hero-countdown-label {
        position: absolute !important;
        top: -.52rem !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: .5rem !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        color: #173f35 !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(.62rem, .9vw, .74rem) !important;
        font-weight: 900 !important;
        letter-spacing: .12em !important;
        line-height: 1 !important;
        text-transform: uppercase !important;
      }
      html body #ts-hero-countdown .ts-hero-countdown-label::before {
        content: "" !important;
        width: .68rem !important;
        height: .68rem !important;
        flex: 0 0 .68rem !important;
        border: 0 !important;
        border-radius: 50% !important;
        background: #e84724 !important;
        box-shadow: 0 0 0 0 rgba(232,71,36,.45) !important;
        animation: ts-launch-pulse 1.8s ease-out infinite !important;
      }
      @keyframes ts-launch-pulse {
        0% { box-shadow: 0 0 0 0 rgba(232,71,36,.48); }
        70%, 100% { box-shadow: 0 0 0 .4rem rgba(232,71,36,0); }
      }
      html body #ts-hero-countdown .ts-hero-countdown-time {
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        align-items: stretch !important;
        gap: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        color: #173f35 !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-weight: 700 !important;
        line-height: 1 !important;
        white-space: nowrap !important;
      }
      html body #ts-hero-countdown .ts-hero-countdown-time > span {
        position: relative !important;
        display: grid !important;
        align-content: center !important;
        justify-content: center !important;
        gap: 0 !important;
        min-width: 0 !important;
        padding: .12rem .3rem !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        text-align: center !important;
      }
      html body #ts-hero-countdown .ts-hero-countdown-time > span:not(:last-child)::after {
        content: none !important;
        display: none !important;
      }
      html body #ts-hero-countdown .ts-hero-countdown-time strong {
        color: #e84724 !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(1.8rem, 3vw, 2.3rem) !important;
        font-weight: 800 !important;
        letter-spacing: 0 !important;
      }
      html body #ts-hero-countdown .ts-hero-countdown-time small {
        color: #173f35 !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(.62rem, .9vw, .74rem) !important;
        font-weight: 700 !important;
        letter-spacing: .02em !important;
        text-transform: uppercase !important;
      }
      @media (max-width: 520px) {
        html body #ts-hero-countdown {
          width: min(calc(100% - 1rem), 22rem) !important;
          max-width: calc(100% - 1.5rem) !important;
          padding: .95rem .45rem .48rem !important;
        }
        html body #ts-hero-countdown .ts-hero-countdown-label {
          gap: .35rem !important;
          font-size: clamp(.7rem, 3vw, .82rem) !important;
          letter-spacing: .07em !important;
        }
        html body #ts-hero-countdown .ts-hero-countdown-time {
          width: 100% !important;
          gap: 0 !important;
        }
        html body #ts-hero-countdown .ts-hero-countdown-time > span {
          gap: .08rem !important;
          padding: .1rem .2rem !important;
        }
        html body #ts-hero-countdown .ts-hero-countdown-time strong {
          font-size: clamp(1.55rem, 7vw, 1.9rem) !important;
        }
        html body #ts-hero-countdown .ts-hero-countdown-time small {
          font-size: clamp(.55rem, 2.4vw, .64rem) !important;
        }
      }
      html body #ts-hero-video-section {
        position: relative !important;
        width: min(calc(100% - 2rem), 46rem) !important;
        max-width: 46rem !important;
        margin: clamp(2rem, 4vw, 3.25rem) auto 0 !important;
        padding: clamp(.4rem, .7vw, .65rem) !important;
        overflow: hidden !important;
        border: 1px solid rgba(23,63,53,.5) !important;
        border-radius: .8rem !important;
        background: #173f35 !important;
        box-shadow: 0 0 0 .35rem rgba(248,244,234,.94), 0 1.5rem 3.5rem rgba(15,44,36,.22) !important;
      }
      html body #ts-hero-video-section video {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        aspect-ratio: 16 / 9 !important;
        border-radius: .4rem !important;
        background: #102c25 !important;
        object-fit: cover !important;
      }
      html body .ts-benefits-section {
        position: relative !important;
        width: 100vw !important;
        max-width: none !important;
        margin-top: 0 !important;
        margin-right: calc(50% - 50vw) !important;
        margin-left: calc(50% - 50vw) !important;
        padding: clamp(4rem, 6vw, 5.5rem) max(1rem, calc((100vw - 76rem) / 2)) clamp(2.75rem, 5vw, 4.5rem) !important;
        border-top: 0 !important;
        background: #173f35 !important;
        box-shadow: none !important;
        color: #f8f4ea !important;
      }
      html body .ts-has-gold-shape {
        position: relative !important;
      }
      html body .ts-inline-gold-shape {
        position: relative !important;
        z-index: 5 !important;
        inset: auto !important;
        display: block !important;
        width: 100% !important;
        height: 8px !important;
        margin: 0 0 clamp(2.5rem, 4vw, 3.5rem) !important;
        padding: 0 !important;
        background: #f0c75e !important;
        box-shadow: 0 1px 0 rgba(23,63,53,.16) !important;
        pointer-events: none !important;
      }
      html body .ts-inline-gold-shape span {
        position: absolute !important;
        z-index: 5 !important;
        top: 8px !important;
        left: 50% !important;
        width: 0 !important;
        height: 0 !important;
        border-top: 22px solid #f0c75e !important;
        border-right: 30px solid transparent !important;
        border-left: 30px solid transparent !important;
        transform: translateX(-50%) !important;
        pointer-events: none !important;
      }
      html body #ts-hero-square-transition,
      html body #ts-square-benefits-transition {
        position: relative !important;
        z-index: 6 !important;
        width: 100vw !important;
        height: 8px !important;
        margin: 0 calc(50% - 50vw) !important;
        flex: 0 0 auto !important;
        box-sizing: border-box !important;
        border: 0 !important;
        background: #f0c75e !important;
        box-shadow: 0 1px 0 rgba(23,63,53,.16) !important;
        overflow: visible !important;
        pointer-events: none !important;
      }
      html body #ts-hero-square-transition span,
      html body #ts-square-benefits-transition span {
        position: absolute !important;
        top: 8px !important;
        left: 50% !important;
        width: 0 !important;
        height: 0 !important;
        border-top: 24px solid #f0c75e !important;
        border-right: 34px solid transparent !important;
        border-left: 34px solid transparent !important;
        transform: translateX(-50%) !important;
      }
      html body .ts-benefits-section,
      html body .ts-benefits-section > div {
        background: #fff !important;
        color: #173f35 !important;
      }
      html body .ts-benefits-section {
        box-shadow: none !important;
      }
      html body .ts-benefits-section #ts-benefits-eyebrow {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: .65rem !important;
        margin: 0 auto clamp(.75rem, 1.5vw, 1rem) !important;
        color: #c18a20 !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(.78rem, 1.2vw, 1rem) !important;
        font-weight: 700 !important;
        letter-spacing: .14em !important;
        line-height: 1.1 !important;
        text-align: center !important;
        text-transform: uppercase !important;
      }
      html body .ts-benefits-section #ts-benefits-eyebrow::before {
        content: none !important;
        display: none !important;
      }
      html body .ts-benefits-section #business-benefits-title {
        margin-top: 0 !important;
        margin-bottom: clamp(1.25rem, 2.5vw, 2rem) !important;
        font-size: clamp(2.7rem, 5.2vw, 5.25rem) !important;
        line-height: .94 !important;
        color: #173f35 !important;
        text-align: center !important;
      }
      html body .ts-benefits-section #business-benefits-title .ts-heading-accent {
        color: #e84724 !important;
      }
      html body .ts-benefits-section #business-benefits-title .ts-mobile-heading-break {
        display: none !important;
      }
      @media (max-width: 520px) {
        html body .ts-benefits-section #business-benefits-title {
          width: calc(100% - 2rem) !important;
          max-width: 24rem !important;
          font-size: clamp(2.05rem, 10.2vw, 2.75rem) !important;
          line-height: .9 !important;
          letter-spacing: -.035em !important;
        }
        html body .ts-benefits-section #business-benefits-title .ts-heading-main,
        html body .ts-benefits-section #business-benefits-title .ts-heading-accent {
          display: block !important;
        }
        html body .ts-benefits-section #business-benefits-title .ts-mobile-heading-break {
          display: inline !important;
        }
        html body .ts-benefits-section #business-benefits-title .ts-heading-accent {
          margin-top: .08em !important;
        }
      }
      html body .ts-benefits-section #ts-benefits-subheading {
        display: block !important;
        margin: 0 auto clamp(2rem, 4vw, 3.25rem) !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: #173f35 !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(1rem, 1.8vw, 1.35rem) !important;
        font-style: normal !important;
        font-weight: 400 !important;
        letter-spacing: .12em !important;
        line-height: 1.2 !important;
        text-align: center !important;
        text-transform: uppercase !important;
      }
      html body .ts-benefits-section .ts-benefits-list {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        grid-template-rows: none !important;
        width: min(calc(100% - 2rem), 70rem) !important;
        margin: 0 auto !important;
        align-items: stretch !important;
        gap: clamp(.9rem, 1.8vw, 1.35rem) !important;
      }
      @media (max-width: 767px) {
        html body .ts-benefits-section .ts-benefits-list {
          grid-template-columns: minmax(0, 1fr) !important;
          grid-template-rows: none !important;
          gap: .85rem !important;
        }
      }
      html body .ts-benefits-section .ts-benefits-list > li {
        min-height: 0 !important;
        margin: 0 !important;
        padding: clamp(1.25rem, 2.5vw, 1.75rem) !important;
        border: 1px solid rgba(23,63,53,.2) !important;
        border-top: 6px solid #f0c75e !important;
        background: #f8f4ea !important;
        box-shadow: 5px 5px 0 rgba(23,63,53,.09) !important;
        color: #294b42 !important;
        font-size: clamp(1rem, 1.3vw, 1.12rem) !important;
        font-weight: 550 !important;
        line-height: 1.55 !important;
        text-align: left !important;
      }
      html body .ts-benefits-section .ts-benefits-list > li:nth-child(3n + 2) {
        border-top-color: #e84724 !important;
      }
      html body .ts-benefits-section .ts-benefits-list > li:nth-child(3n) {
        border-top-color: #17725d !important;
      }
      html body .ts-benefits-section .ts-benefits-list > li strong {
        display: block !important;
        margin-bottom: .4rem !important;
        color: #173f35 !important;
        font-size: clamp(1.08rem, 1.5vw, 1.25rem) !important;
        font-weight: 850 !important;
        line-height: 1.25 !important;
      }
      html body .ts-benefits-section .ts-benefits-list > *::before {
        color: #ef4b2f !important;
      }
      html body .ts-benefits-section #ts-benefits-price {
        width: min(calc(100% - 2rem), 52rem) !important;
        margin: clamp(1.75rem, 4vw, 3rem) auto 0 !important;
        padding: clamp(1.25rem, 2.5vw, 1.7rem) !important;
        border-block: 1px solid rgba(23,63,53,.28) !important;
        background: transparent !important;
        color: #173f35 !important;
        text-align: center !important;
      }
      html body .ts-benefits-section #ts-benefits-price p {
        margin: 0 !important;
        font-size: clamp(1rem, 1.45vw, 1.2rem) !important;
        font-weight: 600 !important;
        line-height: 1.45 !important;
      }
      html body .ts-benefits-section #ts-benefits-price p + p {
        margin-top: .35rem !important;
      }
      html body .ts-benefits-section #ts-benefits-price strong,
      html body .ts-benefits-section #ts-benefits-price b {
        color: #e84724 !important;
        font-weight: 800 !important;
      }
      html body .ts-vsl-cta {
        display: flex !important;
        width: min(calc(100% - 2rem), 42rem) !important;
        min-height: 4rem;
        align-items: center;
        justify-content: center;
        margin: 1.1rem auto .4rem !important;
        padding: .85rem 1.25rem !important;
      }
      html body .ts-benefits-section .ts-benefits-cta {
        width: min(calc(100% - 2rem), 42rem) !important;
        min-height: 4.5rem !important;
        margin: clamp(1.75rem, 4vw, 3rem) auto clamp(2rem, 4vw, 3.25rem) !important;
        padding: 1rem 1.5rem !important;
        border: 2px solid #b92e17 !important;
        border-radius: .45rem !important;
        background: #e84724 !important;
        box-shadow: 0 7px 0 #b92e17 !important;
        color: white !important;
        flex-direction: column !important;
        gap: .2rem !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(1.25rem, 2.2vw, 1.8rem) !important;
        font-style: italic !important;
        font-weight: 700 !important;
        letter-spacing: -.015em !important;
        line-height: 1 !important;
        text-transform: uppercase !important;
      }
      html body .ts-benefits-section .ts-benefits-cta:hover {
        background: #c9361c !important;
      }
      html body .ts-preview-public-cta {
        display: block !important;
        width: calc(100% - 1rem) !important;
        max-width: none !important;
        margin-right: auto !important;
        margin-left: auto !important;
        padding-right: 0 !important;
        padding-left: 0 !important;
        font-size: clamp(.72rem, 3.8vw, 3.2rem) !important;
        letter-spacing: -.035em !important;
        line-height: 1.05 !important;
        text-align: center !important;
        white-space: nowrap !important;
      }
      html body #ts-square-highlights {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: clamp(.65rem, 1.5vw, 1.25rem) !important;
        width: min(calc(100% - 2rem), 38rem) !important;
        margin: 1.25rem auto 1.75rem !important;
        padding: 0 !important;
        list-style: none !important;
      }
      html body #ts-square-highlights li {
        position: relative !important;
        margin: 0 !important;
        padding-left: 1.45rem !important;
        color: #173f35 !important;
        font-size: clamp(.78rem, 1.1vw, .95rem) !important;
        font-weight: 800 !important;
        line-height: 1.25 !important;
        text-align: left !important;
      }
      html body #ts-square-highlights li::before {
        content: "✓" !important;
        position: absolute !important;
        top: -.05em !important;
        left: 0 !important;
        color: #e84724 !important;
        font-size: 1.2em !important;
        font-weight: 700 !important;
      }

      html body #ts-tenner-pricing {
        position: relative !important;
        width: 100vw !important;
        max-width: none !important;
        margin: 0 calc(50% - 50vw) !important;
        padding: clamp(4rem, 8vw, 7rem) max(1.25rem, calc((100vw - 74rem) / 2)) !important;
        border-top: 0 !important;
        background: #f8f4ea !important;
        color: #173f35 !important;
      }
      html body #ts-tenner-pricing > #ts-tenner-gold-shape {
        position: absolute !important;
        top: 0 !important;
        left: 50% !important;
        width: 100vw !important;
        height: 8px !important;
        margin: 0 !important;
        transform: translateX(-50%) !important;
      }
      html body #ts-tenner-pricing > #ts-tenner-gold-shape span {
        top: 8px !important;
      }
      html body #ts-tenner-pricing .ts-tenner-inner {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        gap: .75rem !important;
        width: 100% !important;
        max-width: 52rem !important;
        margin: 0 auto !important;
        text-align: center !important;
      }
      html body #ts-tenner-pricing header p {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: .65rem !important;
        margin: 0 auto .75rem !important;
        color: #52675f !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(.78rem, 1.1vw, .92rem) !important;
        font-weight: 800 !important;
        letter-spacing: .12em !important;
        text-transform: uppercase !important;
      }
      html body #ts-tenner-pricing header p::before {
        content: "" !important;
        width: 2.25rem !important;
        height: 3px !important;
        background: #f0c75e !important;
      }
      html body #ts-tenner-pricing h2 {
        margin: 0 !important;
        color: #173f35 !important;
        font-family: "Anton", Impact, sans-serif !important;
        font-size: clamp(2.5rem, 5vw, 4.25rem) !important;
        font-weight: 400 !important;
        letter-spacing: -.04em !important;
        line-height: 1 !important;
      }
      html body #ts-tenner-pricing h2 span {
        display: block !important;
        color: #e84724 !important;
      }
      html body #ts-tenner-pricing .ts-tenner-copy > p:first-child {
        max-width: 42rem !important;
        margin: 0 auto !important;
        font-size: clamp(1.1rem, 1.7vw, 1.35rem) !important;
        font-weight: 650 !important;
        line-height: 1.55 !important;
      }
      html body #ts-tenner-pricing .ts-tenner-rates {
        width: min(100%, 42rem) !important;
        margin: .5rem auto clamp(1.5rem, 3vw, 2.25rem) !important;
        border: 2px solid #173f35 !important;
        border-radius: .35rem !important;
        background: #fffdf7 !important;
        box-shadow: 8px 8px 0 rgba(240,199,94,.72) !important;
      }
      html body #ts-tenner-pricing .ts-tenner-rates p {
        display: block !important;
        width: 100% !important;
        margin: 0 !important;
        padding: clamp(1.1rem, 2.5vw, 1.5rem) clamp(1rem, 3vw, 2rem) !important;
        border-bottom: 1px solid rgba(23,63,53,.28) !important;
        font-size: clamp(1.1rem, 1.8vw, 1.4rem) !important;
        font-weight: 700 !important;
        line-height: 1.35 !important;
        text-align: center !important;
      }
      html body #ts-tenner-pricing .ts-tenner-rates p:last-child {
        border-bottom: 0 !important;
      }
      html body #ts-tenner-pricing .ts-tenner-number {
        color: #a67c18 !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-weight: 800 !important;
      }
      html body #ts-tenner-pricing .ts-tenner-rates strong {
        color: #e84724 !important;
        font-weight: 850 !important;
      }
      html body #ts-tenner-pricing .ts-pricing-reminder {
        width: min(100%, 52rem) !important;
        margin: 0 auto clamp(1.75rem, 3vw, 2.5rem) !important;
        padding: clamp(1.75rem, 3.5vw, 2.75rem) 0 !important;
        border-top: 2px solid #173f35 !important;
        border-bottom: 2px solid #173f35 !important;
        background: transparent !important;
        color: #173f35 !important;
        text-align: left !important;
      }
      html body #ts-tenner-pricing .ts-pricing-reminder h3 {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: .8rem !important;
        margin: 0 0 clamp(1.5rem, 3vw, 2.25rem) !important;
        color: #173f35 !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(1.8rem, 3vw, 2.5rem) !important;
        font-weight: 900 !important;
        letter-spacing: -.02em !important;
        line-height: 1 !important;
        text-align: center !important;
        text-transform: uppercase !important;
      }
      html body #ts-tenner-pricing .ts-pricing-reminder h3::before {
        content: none !important;
        display: none !important;
      }
      html body #ts-tenner-pricing .ts-pricing-reminder ul {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: clamp(1.35rem, 3vw, 2.25rem) clamp(1.5rem, 4vw, 3rem) !important;
        counter-reset: reminder !important;
        margin: 0 !important;
        padding: 0 !important;
        list-style: none !important;
      }
      html body #ts-tenner-pricing .ts-pricing-reminder li {
        position: relative !important;
        margin: 0 !important;
        padding: 0 0 0 2.6rem !important;
        font-size: clamp(.95rem, 1.35vw, 1.08rem) !important;
        line-height: 1.55 !important;
        counter-increment: reminder !important;
      }
      html body #ts-tenner-pricing .ts-pricing-reminder li::before {
        content: "0" counter(reminder) !important;
        position: absolute !important;
        top: .05rem !important;
        left: 0 !important;
        color: #c38b00 !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: 1.25rem !important;
        font-weight: 900 !important;
        line-height: 1 !important;
      }
      html body #ts-tenner-pricing .ts-pricing-reminder li strong {
        color: #e84724 !important;
      }
      @media (max-width: 640px) {
        html body #ts-tenner-pricing .ts-pricing-reminder ul {
          grid-template-columns: minmax(0, 1fr) !important;
        }
      }
      html body #ts-tenner-pricing .ts-tenner-promise {
        max-width: 42rem !important;
        margin: clamp(5.5rem, 9vw, 7rem) auto 2rem !important;
        font-size: 1rem !important;
        font-weight: 700 !important;
        line-height: 1.55 !important;
      }
      html body #ts-tenner-pricing .ts-tenner-cta {
        width: 100% !important;
        min-height: 4.5rem !important;
        padding: 1rem 1.5rem !important;
        border: 2px solid #b92e17 !important;
        border-radius: .45rem !important;
        background: #e84724 !important;
        box-shadow: 0 7px 0 #b92e17 !important;
        color: white !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(1.25rem, 2.2vw, 1.8rem) !important;
        font-style: italic !important;
        font-weight: 900 !important;
        letter-spacing: -.015em !important;
        line-height: 1 !important;
        text-transform: uppercase !important;
        cursor: pointer !important;
      }
      html body #ts-tenner-pricing .ts-tenner-cta:hover {
        background: #c9361c !important;
      }

      html body .ts-steps-head {
        padding: clamp(2.5rem, 5vw, 4rem) 1rem !important;
        background: #fffdf7 !important;
        color: #173f35 !important;
      }
      html body .ts-steps-head h2 {
        color: #173f35 !important;
        text-align: center !important;
      }
      html body .ts-steps-section-clean,
      html body .ts-steps-section-clean .ts-steps-heading-layer {
        background: #fffdf7 !important;
        color: #173f35 !important;
      }
      html body .ts-steps-section-clean .ts-steps-heading-layer {
        min-height: 0 !important;
      }
      html body .ts-steps-section-clean h2 {
        width: min(calc(100% - 2rem), 64rem) !important;
        margin-right: auto !important;
        margin-left: auto !important;
        color: #173f35 !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(3rem, 6vw, 5.5rem) !important;
        font-weight: 700 !important;
        line-height: .95 !important;
        text-align: center !important;
        text-wrap: balance !important;
      }
      html body #ts-steps-cta {
        display: block !important;
        width: min(calc(100% - 2rem), 42rem) !important;
        min-height: 3.75rem !important;
        margin: clamp(1.75rem, 4vw, 3rem) auto clamp(2.5rem, 5vw, 4rem) !important;
        padding: .85rem 1.25rem !important;
        border: 2px solid #b92f18 !important;
        border-radius: .35rem !important;
        background: #e84724 !important;
        box-shadow: 0 5px 0 #b92f18 !important;
        color: #fff !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(1.4rem, 2.7vw, 2.15rem) !important;
        font-style: italic !important;
        font-weight: 900 !important;
        line-height: 1 !important;
        text-align: center !important;
        text-transform: uppercase !important;
        cursor: pointer !important;
      }

      @media (max-width: 767px) {
        html body #ts-steps-cta {
          margin-bottom: 2.25rem !important;
        }
        html body .ts-steps-section-clean h2 {
          font-size: clamp(2.25rem, 10vw, 3.25rem) !important;
        }
        html body #ts-tenner-pricing .ts-tenner-inner {
          grid-template-columns: minmax(0, 1fr) !important;
          gap: 2rem !important;
        }
        html body #ts-tenner-pricing h2 {
          font-size: clamp(3.25rem, 15vw, 5rem) !important;
        }
      }

      @media (min-width: 640px) {
        html body #ts-hero-frame > .town-street-frame {
          inset: 0 !important;
          overflow: hidden !important;
          filter: saturate(.92) contrast(1.02) !important;
        }
        html body #ts-hero-frame > .town-street-frame .town-photo-side {
          top: 0 !important;
          bottom: 0 !important;
          width: 50.2% !important;
          border: 0 !important;
          clip-path: none !important;
          transform: none !important;
        }
        html body #ts-hero-frame::after {
          inset: 0 !important;
          background: radial-gradient(ellipse at center, rgba(248,244,234,.92) 0%, rgba(248,244,234,.82) 44%, rgba(248,244,234,.38) 72%, rgba(248,244,234,.12) 100%) !important;
        }
      }

      @media (min-width: 768px) {
        html body .launch-stage {
          display: block !important;
          width: min(calc(100vw - 3rem), 50rem) !important;
          max-width: 50rem !important;
          margin: clamp(2.75rem, 4vw, 4rem) auto 0 !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          padding-bottom: 0 !important;
          overflow: visible !important;
        }
        html body .launch-stage,
        html body .launch-stage > *,
        html body .launch-stage #ts-grid {
          max-height: none !important;
          overflow: visible !important;
          clip-path: none !important;
        }
      }

      html body #ts-benefits-offer.ts-offer-reordered .ts-offer-free {
        display: block;
        font-family: "Barlow Condensed", Impact, sans-serif;
        font-size: clamp(.78rem, 3.25vw, 3rem);
        font-weight: 800;
        line-height: 1;
        text-transform: uppercase;
        white-space: nowrap;
      }
      html body #ts-benefits-offer.ts-offer-reordered .ts-offer-free span {
        color: #e84724;
      }
      html body #ts-benefits-offer.ts-offer-reordered .ts-offer-price {
        margin: .6rem 0 0 !important;
        font-size: clamp(1rem, 2vw, 1.35rem) !important;
        font-weight: 500 !important;
      }

      html body #launch-title .ts-title-place br {
        display: none;
      }

      html body #launch-title .ts-title-launch {
        margin-top: .12em !important;
        color: #e84724 !important;
      }

      .ts-local-preview {
        position: fixed;
        inset: 0;
        z-index: 99999;
      }
      .ts-local-preview-backdrop {
        position: absolute;
        inset: 0;
        width: 100%;
        border: 0;
        background: rgba(16,44,37,.62);
        backdrop-filter: blur(2px);
      }
      .ts-local-preview aside {
        position: absolute;
        inset: 0 0 0 auto;
        width: min(30rem, 92vw);
        overflow-y: auto;
        background: #fffdf7;
        color: #173f35;
        text-align: left;
        box-shadow: -18px 0 50px rgba(15,44,36,.28);
      }
      .ts-local-preview-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        z-index: 2;
        width: 2.75rem;
        height: 2.75rem;
        border: 0;
        border-radius: 50%;
        background: white;
        color: #173f35;
        font-size: 1.7rem;
        font-weight: 800;
        cursor: pointer;
      }
      .ts-local-preview-photo {
        position: relative;
        height: 15rem;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: linear-gradient(135deg, #f0c75e 0 48%, #173f35 48% 100%);
      }
      .ts-local-preview-photo span {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        padding: .55rem .75rem;
        background: #f0c75e;
        font-size: .66rem;
        font-weight: 700;
        letter-spacing: .1em;
        text-transform: uppercase;
      }
      .ts-local-preview-photo .ts-shopfront-photo { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 0; object-fit: cover; filter: saturate(.92) contrast(1.04); }
      .ts-local-preview-photo::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, rgba(9,35,29,.72), rgba(9,35,29,.04) 65%); pointer-events: none; }
      .ts-local-preview-photo .ts-business-logo { position: absolute; z-index: 2; top: 1rem; left: 1rem; display: grid; width: 5.2rem; height: 5.2rem; place-content: center; border: .28rem solid #fffdf7; border-radius: 50%; background: #173f35; box-shadow: 0 .5rem 1.5rem rgba(10,35,29,.3); color: #fffdf7; font-family: Arial, sans-serif; font-size: .72rem; font-weight: 900; letter-spacing: .06em; line-height: 1.05; text-align: center; text-transform: uppercase; }
      .ts-local-preview-photo > span {
        position: absolute !important;
        z-index: 3 !important;
        top: 1rem !important;
        right: 4.75rem !important;
        bottom: auto !important;
        left: auto !important;
        max-width: calc(100% - 11rem) !important;
        padding: .5rem .8rem !important;
        background: #f0c75e !important;
        color: #173f35 !important;
        font-size: .72rem !important;
        font-weight: 900 !important;
        letter-spacing: .1em !important;
        line-height: 1.1 !important;
        text-align: center !important;
        white-space: nowrap !important;
        box-shadow: 0 .35rem 1rem rgba(10,35,29,.22);
      }
      .ts-local-preview-photo strong {
        position: absolute;
        z-index: 2;
        left: 1rem;
        right: 1rem;
        bottom: 1.15rem;
        max-width: none;
        color: #fff;
        font-family: "Barlow Condensed", Impact, sans-serif;
        font-size: 1.7rem;
        font-weight: 800;
        line-height: .95;
        text-align: left;
        text-transform: uppercase;
      }
      @media (max-width: 520px) {
        .ts-local-preview-photo > span {
          top: auto !important;
          right: 1rem !important;
          bottom: 4.75rem !important;
          max-width: calc(100% - 2rem) !important;
          font-size: .58rem !important;
        }
        .ts-local-preview-photo strong {
          font-size: clamp(1.25rem, 7vw, 1.7rem) !important;
        }
      }
      .ts-local-preview-content { padding: 1.7rem; }
      .ts-local-preview-content small {
        color: #e84724;
        font-weight: 700;
        letter-spacing: .1em;
        text-transform: uppercase;
      }
      .ts-local-preview-content h2 {
        margin: .7rem 0 0;
        font-family: "Anton", Impact, sans-serif;
        font-size: 3rem;
        font-weight: 400;
        letter-spacing: -.025em;
        line-height: 1;
        text-transform: uppercase;
      }
      .ts-local-preview-rating { margin-top: 1rem; color: #667a72; font-size: .8rem; font-weight: 700; }
      .ts-local-preview-rating b { margin-right: .35rem; color: #173f35; font-size: 1.2rem; }
      .ts-local-preview-rating span { margin-right: .45rem; color: #c18a20; letter-spacing: .06em; }
      .ts-local-preview-content p { margin: 1.2rem 0 0; color: #52675f; font-size: 1rem; font-weight: 650; line-height: 1.65; }
      .ts-local-preview-links { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-top: 1.35rem; }
      .ts-local-preview-links b { display: grid; min-height: 3rem; place-items: center; padding: .5rem; border: 1px solid #9fb2a9; font-size: .82rem; text-align: center; }
      .ts-local-preview-links b:first-child { border-color: #173f35; background: #173f35; color: white; }
      .ts-local-preview-socials { display: flex; align-items: stretch; justify-content: space-between; gap: .45rem; margin-top: .85rem; }
      .ts-local-preview-socials button { display: grid; flex: 1 1 0; min-width: 0; min-height: 3.25rem; place-items: center; gap: .2rem; padding: .4rem .2rem; border: 0; border-radius: .45rem; background: #eef2ef; color: #173f35; font: inherit; font-size: .64rem; font-weight: 800; cursor: pointer; }
      .ts-local-preview-socials button:first-child { background: #eef2ef; color: #173f35; }
      .ts-local-preview-socials button:hover { background: #f0c75e; color: #173f35; }
      .ts-local-preview-socials svg { width: 1.25rem; height: 1.25rem; overflow: visible; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      .ts-local-preview-socials button:nth-child(2) svg { fill: currentColor; stroke: none; }
      .ts-local-preview-socials .ts-icon-fill { fill: currentColor; stroke: none; }

      html body .ts-why-grid {
        grid-template-columns: minmax(0, 1fr) !important;
      }
      html body div.order-5.mb-12.max-w-6xl {
        display: none !important;
      }
      html body .ts-why-white-section,
      html body .ts-why-white-section > div,
      html body .ts-why-heading-unified {
        background: #173f35 !important;
        color: #fff !important;
      }
      html body .ts-why-white-section #why-town-square-title,
      html body .ts-why-white-section .ts-why-intro-moved {
        color: #fff !important;
      }
      html body .ts-why-white-section > .ts-inline-gold-shape {
        background: #f0c75e !important;
        margin-bottom: 0 !important;
      }
      html body .ts-why-white-section .ts-why-head {
        padding-top: 1.75rem !important;
      }
      html body .ts-why-vertical {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        width: 100vw !important;
        max-width: none !important;
        margin-inline: calc(50% - 50vw) !important;
      }
      html body .ts-why-grid article {
        display: block !important;
        width: 100% !important;
        padding-right: max(1.25rem, calc((100vw - 58rem) / 2)) !important;
        padding-left: max(1.25rem, calc((100vw - 58rem) / 2)) !important;
        border-right: 0 !important;
        text-align: center !important;
      }
      html body .ts-why-grid article b,
      html body .ts-why-grid article h3,
      html body .ts-why-grid article p {
        margin-right: auto !important;
        margin-left: auto !important;
        text-align: center !important;
      }
      html body .ts-why-grid article b {
        font-size: clamp(1rem, 1.5vw, 1.2rem) !important;
        letter-spacing: .15em !important;
      }
      html body .ts-why-grid article h3 {
        font-size: clamp(2.25rem, 4vw, 3.5rem) !important;
        line-height: 1 !important;
      }
      html body .ts-why-grid article p {
        max-width: 52rem !important;
        font-size: clamp(1.2rem, 2vw, 1.5rem) !important;
        line-height: 1.5 !important;
      }
      html body .ts-why-vertical > * {
        width: 100% !important;
        border-right: 0 !important;
      }
      html body .ts-why-intro-moved {
        max-width: 48rem !important;
        margin: 1rem auto 0 !important;
        padding: 0 !important;
        background: transparent !important;
        color: #fff !important;
        font-size: clamp(1.3rem, 2.2vw, 1.75rem) !important;
        font-weight: 700 !important;
        line-height: 1.4 !important;
        text-align: center !important;
      }
      @media (max-width: 520px) {
        html body .ts-why-heading-unified,
        html body .ts-why-heading-unified > div {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          height: auto !important;
          max-height: none !important;
          margin-right: 0 !important;
          margin-left: 0 !important;
          padding-right: 0 !important;
          padding-left: 0 !important;
          box-sizing: border-box !important;
          overflow: visible !important;
          clip-path: none !important;
        }
        html body .ts-why-intro-moved {
          display: block !important;
          justify-self: stretch !important;
          width: auto !important;
          max-width: none !important;
          margin: 1rem 1.25rem 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
          font-size: clamp(1rem, 4.8vw, 1.2rem) !important;
          line-height: 1.4 !important;
          white-space: normal !important;
          overflow: visible !important;
          overflow-wrap: break-word !important;
          position: relative !important;
          inset: auto !important;
          transform: none !important;
        }
      }
      html body .ts-why-heading-unified {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) !important;
        padding-top: .25rem !important;
        padding-bottom: clamp(.75rem, 1.5vw, 1.25rem) !important;
        text-align: center !important;
      }
      html body .ts-why-heading-unified > div {
        width: 100% !important;
        text-align: center !important;
      }
      html body .ts-why-white-section #why-town-square-title {
        width: min(calc(100% - 2rem), 58rem) !important;
        margin-right: auto !important;
        margin-left: auto !important;
        text-align: center !important;
        text-wrap: balance !important;
      }
      html body .ts-why-white-section #why-town-square-title .ts-why-heading-accent {
        color: #f0c75e !important;
      }
      html body #ts-who-title {
        margin: 0 auto 1.25rem !important;
        color: #173f35 !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(2rem, 4vw, 3.5rem) !important;
        font-weight: 800 !important;
        letter-spacing: -.04em !important;
        line-height: 1 !important;
        text-align: center !important;
      }
      html body .ts-white-confirmation-background,
      html body .ts-white-confirmation-note {
        background: #fff !important;
      }
      #ts-customer-discoveries {
        width: min(calc(100% - 2rem), 65rem);
        max-width: 65rem;
        margin: 1.25rem auto 0;
        padding: clamp(2rem, 4vw, 3rem) clamp(1.5rem, 4vw, 3.5rem);
        border: 1px solid rgba(240,199,94,.55);
        border-top: .35rem solid #f0c75e;
        background: #173f35;
        color: #f8f4ea;
        box-shadow: 0 1rem 2.5rem rgba(23,63,53,.14);
      }
      .ts-customer-discoveries-inner {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: clamp(1.75rem, 3vw, 2.5rem);
        max-width: 58rem;
        margin: 0 auto;
        padding: 0;
      }
      #ts-customer-discoveries-title {
        max-width: none;
        margin: 0;
        font-family: Arial, sans-serif;
        font-size: clamp(2rem, 3.5vw, 3rem);
        font-weight: 800;
        letter-spacing: -.035em;
        line-height: 1.05;
        text-align: center;
      }
      #ts-customer-discoveries ul {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        margin: 0;
        padding: 0;
        gap: 0;
        list-style: none;
      }
      #ts-customer-discoveries li {
        position: relative;
        margin: 0;
        padding: 1rem 0 1rem 1.75rem;
        border-top: 1px solid rgba(248,244,234,.2);
        color: #f8f4ea;
        font-size: clamp(1rem, 1.4vw, 1.15rem);
        font-weight: 500;
        line-height: 1.5;
      }
      #ts-customer-discoveries li:last-child { border-bottom: 1px solid rgba(248,244,234,.2); }
      #ts-customer-discoveries li strong { color: inherit; font-weight: 750; }
      #ts-customer-discoveries li::before {
        content: "✓";
        position: absolute;
        left: 0;
        color: #f0c75e;
        font-weight: 900;
      }
      #ts-town-square-divider {
        width: 100% !important;
        height: clamp(3.5rem, 7vw, 6rem) !important;
        margin: 0 !important;
        overflow: hidden !important;
        background: transparent !important;
        pointer-events: none;
      }
      #ts-town-square-divider svg {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
      }
      .ts-local-preview-join { width: 100%; min-height: 3.5rem; margin-top: 1rem; border: 0; background: #e84724; color: white; font-family: "Barlow Condensed", Impact, sans-serif; font-size: 1.35rem; font-style: italic; font-weight: 900; text-transform: uppercase; cursor: pointer; }
      .ts-local-preview-content em { display: block; margin-top: .7rem; color: #60756d; font-size: .75rem; font-style: normal; font-weight: 700; text-align: center; }

      .ts-hero-stats {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        width: min(100%, 49rem) !important;
        margin: 2rem auto 2.25rem !important;
        padding: 1.1rem 1.4rem !important;
        gap: 0 !important;
        border: 0 !important;
        border-block: 1px solid rgba(23,63,53,.35) !important;
        border-radius: 0 !important;
        background: rgba(248,244,234,.78) !important;
        box-shadow: none !important;
        color: #173f35 !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(1rem, 2.2vw, 1.45rem) !important;
        font-weight: 800 !important;
        line-height: 1.05 !important;
        text-transform: uppercase !important;
      }

      .ts-hero-stats > span {
        display: grid !important;
        min-height: 4.2rem;
        place-content: center;
        padding: .35rem 1rem;
        white-space: normal !important;
      }

      .ts-hero-stats > span + span {
        border-left: 1px solid rgba(23,63,53,.25);
      }

      .ts-hero-stats strong {
        color: #f0c75e !important;
        font-size: 1.4em !important;
        line-height: .9 !important;
      }

      html body #ts-hero-frame .ts-hero-stats.ts-hero-message {
        display: grid !important;
        grid-template-columns: minmax(18rem, 1.35fr) minmax(22rem, 1fr) !important;
        align-items: center !important;
        width: 100vw !important;
        max-width: none !important;
        margin: clamp(1.75rem, 3vw, 2.5rem) calc(50% - 50vw) clamp(2.25rem, 4vw, 3.5rem) !important;
        padding: clamp(1.45rem, 2.5vw, 2rem) max(2rem, calc((100vw - 72rem) / 2)) !important;
        border: 0 !important;
        border-bottom: .3rem solid #f0c75e !important;
        background: #173f35 !important;
        box-shadow: none !important;
      }
      @media (min-width: 768px) {
        html body #ts-hero-frame .ts-hero-stats.ts-hero-message.ts-stats-mobile {
          display: none !important;
        }
      }
      .ts-hero-stats.ts-hero-message::after {
        content: none;
      }
      .ts-hero-stats.ts-hero-message > .ts-hero-message-title {
        color: #f8f4ea !important;
        min-height: auto !important;
        place-content: center start !important;
        padding: 0 clamp(1.5rem, 4vw, 4rem) 0 0 !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(1.55rem, 2.5vw, 2.35rem) !important;
        font-weight: 700 !important;
        letter-spacing: -.045em;
        line-height: 1.05 !important;
        text-align: left !important;
        text-transform: none !important;
        white-space: normal !important;
      }
      .ts-hero-stats > .ts-hero-message-stats {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        min-height: auto !important;
        align-items: center;
        justify-content: stretch;
        gap: clamp(1rem, 2.5vw, 2.5rem);
        padding: 0 !important;
        border-top: 0 !important;
        border-left: 0 !important;
        color: #f8f4ea;
        font-family: Arial, sans-serif !important;
        font-size: clamp(.76rem, 1vw, .9rem);
        font-weight: 600;
        letter-spacing: 0;
        line-height: 1;
        text-align: left;
        white-space: nowrap;
      }
      .ts-hero-stats > .ts-hero-message-stats b {
        display: grid !important;
        width: auto !important;
        gap: .3rem;
        color: #f8f4ea !important;
        font-weight: 600 !important;
        text-transform: none !important;
      }
      .ts-hero-stats > .ts-hero-message-stats b > strong {
        color: #f8f4ea !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(1.5rem, 2.4vw, 2.15rem) !important;
        font-weight: 800 !important;
        letter-spacing: -.03em;
        line-height: 1 !important;
      }
      .ts-hero-stats > .ts-hero-message-stats b:last-child > strong {
        color: #f0c75e !important;
      }
      .ts-hero-stats > .ts-hero-message-stats b:last-child {
        padding: .65rem .9rem !important;
        border: 1px solid rgba(240,199,94,.72) !important;
        background: rgba(240,199,94,.1) !important;
      }
      .ts-hero-stats > .ts-hero-message-stats b > span {
        color: rgba(248,244,234,.82) !important;
        font-size: 1em;
        font-weight: 600;
        line-height: 1.15;
      }
      html body .ts-businesses-copy-only {
        padding-block: clamp(2rem, 4vw, 3.25rem) !important;
      }
      html body .ts-businesses-copy-only::before,
      html body .ts-businesses-copy-only h2 {
        display: none !important;
      }
      html body .ts-businesses-copy-only p {
        margin-top: 0 !important;
      }

      html body .ts-dominant-businesses {
        position: relative;
        width: min(calc(100% - 3rem), 76rem) !important;
        margin: 3.5rem auto 4.5rem !important;
        padding: clamp(2.8rem, 6vw, 5.8rem) clamp(1.5rem, 6vw, 6rem) !important;
        overflow: hidden;
        border: 0 !important;
        border-block: 1px solid rgba(23,63,53,.28) !important;
        border-radius: 0 !important;
        background: linear-gradient(115deg, #173f35 0 72%, #214f43 72% 100%) !important;
        box-shadow: none !important;
        color: #fff !important;
      }

      html body .ts-dominant-businesses::before {
        content: "LOCAL BUSINESS SPOTLIGHT";
        display: inline-block;
        margin-bottom: 1.25rem;
        padding: .45rem .75rem;
        background: #f0c75e;
        color: #173f35;
        font-family: Arial, sans-serif;
        font-size: .72rem;
        font-weight: 800;
        letter-spacing: .14em;
      }

      html body .ts-plot-preview-dialog .ts-plot-preview-drawer {
        top: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        left: auto !important;
        width: min(30rem, 92vw) !important;
        max-height: none !important;
        border-radius: 0 !important;
      }

      html body .ts-dominant-businesses h2 {
        max-width: 62rem;
        margin: 0 auto !important;
        color: #fff !important;
        font-size: clamp(3.2rem, 7.5vw, 7.2rem) !important;
        line-height: .82 !important;
        letter-spacing: -.035em !important;
        text-wrap: balance;
      }

      html body .ts-dominant-businesses h2.ts-business-count-heading > span {
        display: block;
      }
      html body .ts-dominant-businesses h2.ts-business-count-heading > span:last-child {
        margin-top: .14em;
        color: #f0c75e;
      }

      html body .ts-dominant-businesses p {
        max-width: 64rem;
        margin: 1.8rem auto 0 !important;
        color: #f8f4ea !important;
        font-size: clamp(1.05rem, 2.2vw, 1.55rem) !important;
        font-weight: 800 !important;
        line-height: 1.45 !important;
        white-space: normal !important;
        text-wrap: balance;
      }

      html body .ts-dominant-businesses.ts-businesses {
        width: 100vw !important;
        max-width: none !important;
        margin: 0 calc(50% - 50vw) !important;
        padding: clamp(3.5rem, 6vw, 5.5rem) max(1.25rem, calc((100vw - 72rem) / 2)) !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: #fff !important;
        box-shadow: none !important;
        text-align: center !important;
      }
      html body .ts-dominant-businesses.ts-businesses::before,
      html body .ts-dominant-businesses .ts-business-count-heading {
        display: none !important;
      }
      html body .ts-dominant-businesses #ts-who-title {
        display: block !important;
        margin: 0 auto 1.25rem !important;
        color: #173f35 !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(3rem, 6vw, 5.5rem) !important;
        font-weight: 900 !important;
        line-height: .95 !important;
        text-align: center !important;
        text-transform: none !important;
      }
      html body .ts-dominant-businesses.ts-businesses p {
        max-width: 62rem !important;
        margin: 0 auto !important;
        color: #173f35 !important;
        font-size: clamp(1.15rem, 2vw, 1.5rem) !important;
        line-height: 1.5 !important;
        text-align: center !important;
      }
      html body .ts-business-optin {
        margin-top: 0 !important;
        padding: clamp(3rem, 6vw, 5rem) max(1rem, calc((100vw - 72rem) / 2)) !important;
        background-color: #173f35 !important;
      }
      html body #ts-business-optin-intro {
        width: min(calc(100% - 2rem), 46rem) !important;
        margin: 0 auto clamp(1.5rem, 3vw, 2.25rem) !important;
        color: #fffdf7 !important;
        text-align: center !important;
      }
      html body #ts-business-optin-intro p {
        margin: 0 0 .65rem !important;
        color: #f0c75e !important;
        font-size: clamp(.75rem, 1.1vw, .9rem) !important;
        font-weight: 800 !important;
        letter-spacing: .16em !important;
        line-height: 1 !important;
        text-transform: uppercase !important;
      }
      html body #ts-business-optin-intro h2 {
        margin: 0 !important;
        color: #fffdf7 !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(2.25rem, 5vw, 4.5rem) !important;
        font-weight: 800 !important;
        letter-spacing: -.03em !important;
        line-height: .95 !important;
        text-transform: uppercase !important;
        text-wrap: balance !important;
      }
      html body #ts-business-optin-intro span {
        display: block !important;
        margin-top: 1rem !important;
        color: rgba(255,253,247,.84) !important;
        font-size: clamp(.95rem, 1.4vw, 1.1rem) !important;
        font-weight: 600 !important;
        line-height: 1.45 !important;
      }
      html body .ts-business-optin .town-ghl-form-wrap {
        width: min(100%, 46rem) !important;
        margin: 0 auto !important;
        padding: clamp(.6rem, 1.2vw, .85rem) !important;
        border: 2px solid #f0c75e !important;
        border-radius: .65rem !important;
        background: #fffdf7 !important;
        box-shadow: 0 8px 0 #0d211c !important;
      }
      html body .ts-business-optin .ts-original-ghl-form {
        display: none !important;
      }
      html body #ts-business-waitlist-form {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: clamp(.8rem, 1.6vw, 1.2rem) !important;
        width: min(calc(100% - 2rem), 58rem) !important;
        margin: 0 auto !important;
        padding: clamp(1rem, 2vw, 1.35rem) !important;
        border: 2px solid #f0c75e !important;
        border-radius: .65rem !important;
        background: #fffdf7 !important;
        box-shadow: 0 8px 0 #0d211c !important;
      }
      html body #ts-business-waitlist-form label {
        display: grid !important;
        gap: .45rem !important;
        color: #173f35 !important;
        font-size: .82rem !important;
        font-weight: 800 !important;
        letter-spacing: .02em !important;
        text-align: left !important;
      }
      html body #ts-business-waitlist-form input {
        width: 100% !important;
        min-height: 3.4rem !important;
        padding: .8rem 1rem !important;
        border: 1px solid rgba(23,63,53,.38) !important;
        border-radius: .35rem !important;
        background: #fff !important;
        color: #173f35 !important;
        font: inherit !important;
        font-size: 1rem !important;
        font-weight: 500 !important;
        outline: none !important;
      }
      html body #ts-business-waitlist-form input:focus {
        border-color: #17725d !important;
        box-shadow: 0 0 0 3px rgba(23,114,93,.18) !important;
      }
      html body #ts-business-waitlist-form button {
        grid-column: 1 / -1 !important;
        min-height: 3.65rem !important;
        border: 2px solid #b92f18 !important;
        border-radius: .4rem !important;
        background: #e84724 !important;
        box-shadow: 0 5px 0 #b92f18 !important;
        color: #fff !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(1.45rem, 2.6vw, 2rem) !important;
        font-style: italic !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        cursor: pointer !important;
      }
      html body #ts-business-waitlist-form button:disabled {
        cursor: wait !important;
        opacity: .8 !important;
      }
      html body #ts-business-waitlist-form .ts-optin-status {
        grid-column: 1 / -1 !important;
        min-height: 1.2em !important;
        margin: 0 !important;
        color: #173f35 !important;
        font-size: .85rem !important;
        font-weight: 650 !important;
        text-align: center !important;
      }
      @media (max-width: 640px) {
        html body #ts-business-waitlist-form {
          grid-template-columns: minmax(0, 1fr) !important;
          width: 100% !important;
        }
      }
      html body .ts-business-optin .town-ghl-form {
        display: block !important;
        width: 100% !important;
        border: 0 !important;
        border-radius: .35rem !important;
      }

      html body .ts-cta,
      html body #ts-video-cta,
      html body .ts-reference-cta,
      html body a[href="#founding-access"] {
        border: 2px solid #0d211c !important;
        border-radius: .5rem !important;
        background: #173f35 !important;
        box-shadow: 0 7px 0 #0d211c !important;
        color: #fff !important;
        font-size: clamp(1.6rem, 4vw, 3.15rem) !important;
        font-style: italic !important;
        letter-spacing: -.025em !important;
        line-height: 1 !important;
        text-transform: uppercase !important;
      }

      html body .ts-cta:hover,
      html body #ts-video-cta:hover,
      html body .ts-reference-cta:hover,
      html body a[href="#founding-access"]:hover {
        background: #e84724 !important;
      }

      html body .ts-cta:focus-visible,
      html body #ts-video-cta:focus-visible,
      html body .ts-reference-cta:focus-visible,
      html body a[href="#founding-access"]:focus-visible {
        outline: 4px solid #f0c75e !important;
        outline-offset: 4px !important;
      }

      @media (max-width: 767px) {
        .ts-customer-discoveries-inner {
          grid-template-columns: minmax(0, 1fr);
          gap: 1.25rem;
        }
        #ts-customer-discoveries-title {
          max-width: none;
        }
        #ts-customer-discoveries ul {
          grid-template-columns: minmax(0, 1fr);
          gap: .75rem;
        }
        html body #ts-hero-frame .ts-hero-stats.ts-hero-message.ts-stats-desktop {
          display: none !important;
        }

        html body #ts-hero-frame .ts-hero-stats.ts-hero-message.ts-stats-mobile {
          display: grid !important;
          grid-template-columns: 1fr !important;
          width: 100vw !important;
          margin: 1.35rem calc(50% - 50vw) 2.25rem !important;
          padding: 1.35rem 1.25rem 1.5rem !important;
          gap: 1rem !important;
        }

        html body #launch-title {
          max-width: 31rem !important;
          padding-inline: .35rem !important;
          font-size: clamp(2.65rem, 11.5vw, 3.7rem) !important;
          line-height: .82 !important;
        }

        html body #launch-title .ts-title-place br {
          display: none;
        }

        .ts-hero-stats {
          grid-template-columns: 1fr !important;
          width: calc(100% - 1.25rem) !important;
          padding: .7rem 1rem !important;
          box-shadow: none !important;
        }

        .ts-hero-stats > span {
          min-height: 3.4rem;
        }

        .ts-hero-stats > span + span {
          border-top: 1px solid rgba(23,63,53,.25);
          border-left: 0;
        }

        .ts-hero-stats > .ts-hero-message-stats {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          width: 100% !important;
          gap: clamp(.75rem, 4vw, 1.4rem);
          padding-inline: 0 !important;
          font-size: clamp(.68rem, 3vw, .8rem);
          border-top: 0 !important;
        }

        .ts-hero-stats.ts-hero-message > .ts-hero-message-title {
          padding: 0 !important;
          font-size: clamp(1.3rem, 6vw, 1.65rem) !important;
          letter-spacing: -.035em !important;
        }

        html body .ts-dominant-businesses {
          width: calc(100% - 2rem) !important;
          margin: 2.5rem auto 3.5rem !important;
          padding: 2.2rem 1.1rem 2.5rem !important;
          box-shadow: none !important;
        }

        html body .ts-dominant-businesses h2 {
          max-width: 22rem !important;
          font-size: clamp(2.35rem, 10.5vw, 3.35rem) !important;
          line-height: .88 !important;
        }

        html body .ts-dominant-businesses.ts-businesses p {
          width: 100% !important;
          max-width: 100% !important;
          margin-top: 1.35rem !important;
          padding: 0 .25rem !important;
          box-sizing: border-box !important;
          font-size: .9rem !important;
          font-weight: 600 !important;
          line-height: 1.55 !important;
          white-space: normal !important;
          overflow: visible !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
        }

      }

      html body .ts-hero-stats.ts-hero-message.ts-global-sticky {
        position: sticky !important;
        top: 75px !important;
        z-index: 45 !important;
        display: grid !important;
        grid-template-columns: max-content auto !important;
        align-items: center !important;
        justify-content: center !important;
        width: 100% !important;
        max-width: none !important;
        min-height: 4.25rem !important;
        margin: 0 !important;
        padding: .7rem max(1.5rem, calc((100vw - 72rem) / 2)) !important;
        gap: clamp(2rem, 5vw, 5rem) !important;
        border: 0 !important;
        border-bottom: 1px solid rgba(248,244,234,.18) !important;
        background: #173f35 !important;
        box-shadow: 0 .35rem 1rem rgba(10,35,29,.14) !important;
      }

      html body .ts-hero-stats.ts-hero-message.ts-global-sticky.ts-stats-mobile {
        display: none !important;
      }

      html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-title {
        display: block !important;
        min-height: 0 !important;
        padding: 0 !important;
        color: #f8f4ea !important;
        font-family: Arial, sans-serif !important;
        font-size: clamp(1.05rem, 1.65vw, 1.35rem) !important;
        font-weight: 700 !important;
        letter-spacing: -.025em !important;
        line-height: 1.05 !important;
        text-align: left !important;
        text-transform: none !important;
        white-space: nowrap !important;
      }

      html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        gap: clamp(.65rem, 1.4vw, 1.15rem) !important;
      }

      html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b {
        display: grid !important;
        width: clamp(7.5rem, 10vw, 9.25rem) !important;
        min-height: 0 !important;
        gap: .08rem !important;
        padding: 0 !important;
        color: #f8f4ea !important;
        font-family: Arial, sans-serif !important;
        font-weight: 600 !important;
        line-height: 1 !important;
        text-align: left !important;
        text-transform: none !important;
        white-space: nowrap !important;
      }

      html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b strong {
        color: #f8f4ea !important;
        font-family: "Barlow Condensed", Impact, sans-serif !important;
        font-size: clamp(1.35rem, 2vw, 1.7rem) !important;
        font-weight: 700 !important;
        letter-spacing: -.02em !important;
        line-height: 1 !important;
      }

      html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b:last-child strong {
        color: #f0c75e !important;
        font-size: clamp(1.65rem, 2.35vw, 2.05rem) !important;
        font-weight: 700 !important;
      }
      html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b:last-child strong small {
        margin-right: .18em !important;
        font-family: Arial, sans-serif !important;
        font-size: .42em !important;
        font-style: normal !important;
        font-weight: 700 !important;
        letter-spacing: .08em !important;
        text-transform: uppercase !important;
      }
      html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b:last-child strong em {
        font-style: normal !important;
        font-size: 1.25em !important;
      }
      html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b:last-child {
        place-content: center !important;
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        text-align: center !important;
      }
      html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b:last-child span {
        color: #fff !important;
      }

      html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b span {
        color: #fff !important;
        font-size: clamp(.62rem, .85vw, .72rem) !important;
        font-weight: 500 !important;
        line-height: 1.05 !important;
      }
      html body .launch-stage button[aria-label^="Preview"] {
        transition: filter .18s ease, opacity .18s ease !important;
      }
      html body .launch-stage button[aria-label^="Preview"].ts-filter-match {
        filter: none !important;
        opacity: 1 !important;
      }
      html body .launch-stage button[aria-label^="Preview"].ts-filter-dimmed {
        filter: grayscale(.7) brightness(.48) saturate(.45) !important;
        opacity: .58 !important;
      }

      @media (max-width: 767px) {
        html body .ts-preview-public-cta {
          font-size: clamp(1rem, 5.2vw, 1.5rem) !important;
        }
        html body .launch-stage {
          margin-top: clamp(1.75rem, 7vw, 2.25rem) !important;
        }
        html body #ts-square-highlights {
          grid-template-columns: minmax(0, 1fr) !important;
          gap: .65rem !important;
          width: min(calc(100% - 2rem), 25rem) !important;
          margin-top: 1rem !important;
        }
        html body .ts-hero-stats.ts-hero-message.ts-global-sticky.ts-stats-desktop {
          display: none !important;
        }

        html body .ts-hero-stats.ts-hero-message.ts-global-sticky.ts-stats-mobile {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          justify-content: stretch !important;
          min-height: 0 !important;
          padding: .5rem max(.65rem, env(safe-area-inset-right)) .55rem max(.65rem, env(safe-area-inset-left)) !important;
          gap: .4rem !important;
          top: 52px !important;
        }

        html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-title {
          min-width: 0 !important;
          font-size: clamp(.7rem, 3vw, .84rem) !important;
          line-height: 1.12 !important;
          text-align: center !important;
          white-space: nowrap !important;
        }

        html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b strong {
          font-size: clamp(1rem, 4.6vw, 1.2rem) !important;
        }

        html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
          width: min(100%, 14rem) !important;
          margin: 0 auto !important;
          gap: .2rem !important;
        }

        html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b {
          width: 100% !important;
          text-align: center !important;
        }

        html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b:first-child {
          display: grid !important;
          place-content: center !important;
        }

        html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b:last-child {
          width: 100% !important;
          padding: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
        }

        html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b:last-child strong {
          font-size: clamp(1.05rem, 5.3vw, 1.35rem) !important;
          white-space: nowrap !important;
        }

        html body .ts-hero-stats.ts-hero-message.ts-global-sticky > .ts-hero-message-stats b span {
          font-size: clamp(.48rem, 2.05vw, .58rem) !important;
          white-space: nowrap !important;
        }
      }
    `;
    page.head.appendChild(style);

    Array.from(page.querySelectorAll("button, a")).forEach(function (control) {
      if (control.textContent.toUpperCase().indexOf("JOIN THE LURGAN") !== -1) {
        control.classList.add("ts-reference-cta");
      }
    });
  }

  upgradeLurganPage();
  var readinessChecks = 0;
  var readinessTimer = window.setInterval(function () {
    var frame = document.querySelector('iframe[title="Lurgan Town Square"]');
    var readyPage = frame && frame.contentDocument ? frame.contentDocument : document;
    readinessChecks += 1;
    if (readyPage && readyPage.querySelector(".ts-hero-stats")) {
      upgradeLurganPage();
      if (readinessChecks >= 6 && readyPage.querySelector(".ts-benefits-section")) {
        if (frame) frame.classList.add("ts-upgrade-ready");
        window.clearInterval(readinessTimer);
      }
    }
    if (readinessChecks >= 80) {
      if (frame) frame.classList.add("ts-upgrade-ready");
      window.clearInterval(readinessTimer);
    }
  }, 250);
})();
