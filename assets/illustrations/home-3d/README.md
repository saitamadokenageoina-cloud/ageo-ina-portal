# Home 3D artwork

This directory contains one independent cinematic 3D illustration per home feature. Production card images are 960×640 browser-decodable JPEGs with cache-busting filenames and direct `<img>` references in the card markup. Every release image is listed in `sw.js`; `scripts/quality-check.js` validates the JPEG structure, dimensions declared in the markup, direct-image coverage, and absence of the retired sprite/background pipeline.
