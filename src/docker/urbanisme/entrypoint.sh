#!/bin/bash

#set -x

function addCertificate() {
key=$1
properties_path=$2
echo "Load properties for key ${key}..."

path=`cat "$properties_path" | grep -v '^#' | grep "${key}.path" | cut -d "=" -f 2`
cert=`cat "$properties_path" | grep -v '^#' |grep "${key}.cert" | cut -d "=" -f 2`
alias=`cat "$properties_path" | grep -v '^#' | grep "${key}.alias" | cut -d "=" -f 2`
store=`cat "$properties_path" | grep -v '^#' | grep "${key}.store" | cut -d "=" -f 2`
password=`cat "$properties_path" | grep -v '^#' | grep "${key}.password" | cut -d "=" -f 2`

if [[ -n "$path" && -n "$cert" && -n "$alias" && -n "$store" && -n "$password" ]]; then
	echo "add certs ${alias}: add ${path}/${cert} to ${store}"
	keytool -delete -alias "$alias" -keystore "$store" -storepass "$password" 2>&1
	keytool -importcert -noprompt -alias "$alias" -file "$path$cert" -keystore "$store" -storepass "$password" 2>&1
	echo "done."
else
  echo "Insufficient variables in properties to load certificate into keystore."
fi
}

if [[ -r "$PROPERTIES_PATH" ]]; then
	sed -i 's/\r$//' "${PROPERTIES_PATH}"
	echo "Extract single data..."
	addCertificate "server.trustcert.keystore" "${PROPERTIES_PATH}"

	echo "Start keys..."
	keystoreKeys=`cat "$PROPERTIES_PATH" | awk -F= '/^server.trustcert.keystore.items/ { print $2 }'`

	IFS=',' read -r -a arr <<< "$keystoreKeys"
	for v in "${arr[@]}"; do
	  echo "Handle=> $v"

	  addCertificate "server.trustcert.keystore.$v" "${PROPERTIES_PATH}"
	done

else
  echo "Unreadable properties file ($PROPERTIES_PATH)."
fi

# Run the docker CMD
exec "$@"
