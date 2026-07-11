/**
 * Ghost Gallery Flex Ratio Calculator
 *
 * Replicates Ghost's gallery card behavior by computing each image's
 * aspect ratio (width / height) and applying it as the flex-grow value
 * on the parent .kg-gallery-image container.
 *
 * Ghost computes this server-side from the image metadata. Since Hugo
 * shortcodes don't have access to image dimensions for remote URLs,
 * we compute it client-side from the image's naturalWidth/naturalHeight.
 *
 * The formula is: flex-grow = naturalWidth / naturalHeight
 * e.g. a 2000x1500 image -> flex: 1.33333 1 0%
 *      a 1536x2048 image -> flex: 0.75 1 0%
 */
(function () {
	"use strict";

	function setFlex(img) {
		if (img.naturalWidth && img.naturalHeight) {
			var ratio = img.naturalWidth / img.naturalHeight;
			img.parentElement.style.flex = ratio + " 1 0%";
		}
	}

	function applyGalleryFlex() {
		var images = document.querySelectorAll(".kg-gallery-image img");

		for (var i = 0; i < images.length; i++) {
			var img = images[i];

			if (img.complete && img.naturalWidth) {
				// Image already loaded (cached or eager)
				setFlex(img);
			} else {
				// Image not yet loaded — listen for load event.
				// This handles both lazy-loaded images that come into view
				// later and images still being fetched.
				img.addEventListener("load", function () {
					setFlex(this);
				});
			}
		}
	}

	// Run on DOMContentLoaded, or immediately if the DOM is already ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", applyGalleryFlex);
	} else {
		applyGalleryFlex();
	}
})();
