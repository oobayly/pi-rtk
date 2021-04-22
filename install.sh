#!/usr/bin/bash

TARGET="/opt/pi-rtk"
TARGET_BIN="${TARGET}/bin"
TARGET_ETC="${TARGET}/etc"
TARGET_SERVICES="${TARGET}/services"
TARGET_HTTP="${TARGET}/http"
ETC="/etc/pi-rtk"
CACHE="/var/cache/pi-rtk"
SYSTEMD="/etc/systemd/system"

# Ensure paths are present
echo "Creating ${TARGET} directories..."
mkdir -p "${TARGET}"
mkdir -p "${TARGET_BIN}"
mkdir -p "${TARGET_ETC}"
mkdir -p "${TARGET_SERVICES}"
mkdir -p "${TARGET_HTTP}"
mkdir -p "${CACHE}"

echo "Copying files..."
rsync package/bin/* "${TARGET_BIN}"
rsync package/services/* "${TARGET_SERVICES}"

# Don't overwrite existing config files
for f in package/etc/*; do
	n=$(basename "${f}")
	if [ ! -f "${TARGET_ETC}/${n}" ]; then
		cp "${f}" "${TARGET_ETC}"
	fi
done

# Cron scripts
for f in package/cron.hourly/*; do
	cp "${f}" /etc/cron.hourly
done
for f in package/cron.daily/*; do
	cp "${f}" /etc/cron.daily
done

# Build web app
echo "Copying web app..."
rsync -r pi-rtk-http/dist/* "${TARGET_HTTP}"
echo "Installing packages for HTTP server..."
npm --prefix "${TARGET_HTTP}" install --only=prod

echo "Creating symlinks..."
if [ ! -L "${ETC}" ]; then
	ln -s "${TARGET_ETC}" "${ETC}"
fi
for s in "${TARGET_SERVICES}"/*; do
	trg="${SYSTEMD}/$(basename "${s}")"
	if [ ! -L "${trg}" ]; then
		ln -s "${s}" "${trg}"
	fi
done

echo "Setting permissions..."
chown -R root:root "${TARGET}"
find "${TARGET}" -type d -exec chmod 755 {} \;
find "${TARGET}" -type f -exec chmod 644 {} \;
find "${TARGET_BIN}" -type f -exec chmod 755 {} \;


