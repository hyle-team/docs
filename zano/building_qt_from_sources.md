# Building Qt from sources for Zano
##### (Ubuntu 16.04, 18.04)
----------

### 1. Use Qt **5.13.2**! Version is important!
(e.g. for 5.11.2 you won't get WebEngineWidgets working for unknown reason)

### 2. Download Qt sources
    wget https://download.qt.io/archive/qt/5.13/5.13.2/single/qt-everywhere-src-5.13.2.tar.xz

### 3. Unpack the sources
    tar -xJf qt-everywhere-src-5.13.2.tar.xz

### 4. Install prerequisites:
    sudo apt-get install bison build-essential flex gperf gyp libasound2-dev libavcodec-dev libavformat-dev libavutil-dev libbz2-dev libcap-dev libcups2-dev libdrm-dev libegl1-mesa-dev libevent-dev libfontconfig1-dev libgcrypt11-dev libjsoncpp-dev libminizip-dev libnss3-dev libopus-dev libpci-dev libpulse-dev libsrtp0-dev libssl-dev libudev-dev libwebp-dev libxcb1 libxcb1-dev libxcomposite-dev libxcursor-dev libxdamage-dev libxkbcommon-dev libxrandr-dev libxss-dev libxtst-dev ninja-build python ruby

### 5. Configure Qt:
    ./configure -platform linux-g++ -prefix <QT_INSTALL_PATH> -opensource -confirm-license -xcb -nomake examples -nomake tests -feature-webengine-embedded-build -feature-webengine-pepper-plugins -feature-webengine-printing-and-pdf -feature-webengine-proprietary-codecs -feature-webengine-spellchecker -feature-webengine-v8-snapshot -feature-webengine-webrtc -feature-thread -xkbcommon -no-feature-d3d12 -no-feature-qt3d-animation -no-feature-qt3d-extras -no-feature-qt3d-input -no-feature-qt3d-logic -no-feature-qt3d-opengl-renderer -no-feature-qt3d-render -no-feature-qt3d-simd-avx2 -no-feature-qt3d-simd-sse2 -no-feature-gestures
Replace <QT_INSTALL_PATH> with the actual path of where you'd like to put built Qt libs.

### 6. make
    make

### 7. make install
    make install

### 8. Tell Zano building system of where you place Qt by setting `QT_PREFIX_PATH` environment variable to `<QT_INSTALL_PATH>`
