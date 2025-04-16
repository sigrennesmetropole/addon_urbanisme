#!/bin/bash

if [[ -r "$PROPERTIES_PATH" ]]; then

	properties=$(<"$PROPERTIES_PATH")

    path=`echo "$properties" | awk -F= '/^server.trustcert.keystore.path/ { print $2 }'`
	cert=`echo "$properties" | awk -F= '/^server.trustcert.keystore.cert/ { print $2 }'`
	alias=`echo "$properties" | awk -F= '/^server.trustcert.keystore.alias/ { print $2 }'`
	store=`echo "$properties" | awk -F= '/^server.trustcert.keystore.store/ { print $2 }'`
	password=`echo "$properties" | awk -F= '/^server.trustcert.keystore.password/ { print $2 }'`

	if [[ -n "$path" && -n "$cert" && -n "$alias" && -n "$store" && -n "$password" ]]; then

		keytool -delete -alias "$alias" -keystore "$store" -storepass "$password" 2>&1
		keytool -importcert -noprompt -alias "$alias" -file "$path$cert" -keystore "$store" -storepass "$password" 2>&1

	else
	  echo "Insufficient variables in properties to load certificate into keystore."
	fi
else
  echo "Unreadable properties file ($PROPERTIES_PATH)."
fi

# Run the docker CMD
exec "$@"