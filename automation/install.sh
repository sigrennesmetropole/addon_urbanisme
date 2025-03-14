#!/bin/bash

set -x

POD_NAME="kubectl get pods -o name | grep "urbanisme-back-${TARGET_ENV}" | sed -e 's:pod\/::g'"
echo "Current pod? $POD_NAME"

# ajout module
helm upgrade --install -f back.yaml -f config/"${TARGET_ENV}"/back."${TARGET_ENV}".yaml urbanisme-back-"${TARGET_ENV}" boost-stable/boost-deploy

# création du déploiement
kubectl apply -f config/"${TARGET_ENV}"/secret."${TARGET_ENV}".yaml

# ajout du répertoire partagé
sed -i "s/TARGET_ENV/${TARGET_ENV}/g" back-config.yaml

kubectl patch deployment urbanisme-back-"${TARGET_ENV}"-rm-urbanisme-back --patch-file back-config.yaml

kubectl apply -f config/"${TARGET_ENV}"/back.ingress."${TARGET_ENV}".yaml

helm upgrade --install -f cadastrapp.yaml cadastrapp boost-stable/boost-deploy
kubectl patch deployment cadastrapp --patch-file back-config.yaml

# on attend que tout soit démarré
sleep 15

# copie des fichiers
POD_NAME="kubectl get pods -o name | grep "urbanisme-back-${TARGET_ENV}" | sed -e 's:pod\/::g'"
echo "Target pod $POD_NAME"
if [ ! -z "$POD_NAME" ]; then

	def_properties="kubectl exec $POD_NAME -it -- ls /etc/georchestra/default.properties"
	if [ -z "${def_properties}" ]; then
		kubectl cp "config/${TARGET_ENV}/default.properties" "$POD_NAME":"/etc/georchestra/default.properties"
	fi 
	kubectl cp "config/${TARGET_ENV}/log4j2.xml" "$POD_NAME":"/etc/georchestra/urbanisme/log4j2.xml"
	kubectl cp "config/${TARGET_ENV}/urbanisme.properties" "$POD_NAME":"/etc/georchestra/urbanisme/urbanisme.properties"
	kubectl cp "config/${TARGET_ENV}/cadastrapp.properties" "$POD_NAME":"/etc/georchestra/cadastrapp/cadastrapp.properties"

fi

POD_NAME="kubectl get pods -o name | grep "georchestra-mapstore-" | sed -e 's:pod\/::g'"
echo "Target pod for gateway config : $POD_NAME"
if [ -n "$POD_NAME" ]; then

	echo "copy local of file /etc/georchestra/gateway/routes.yaml ..."
	kubectl cp "${POD_NAME}":/etc/georchestra/gateway/routes.yaml routes.yaml
	echo "copy local of file /etc/georchestra/gateway/routes.yaml done."
	
	path="yq e '.spring.cloud.gateway.routes[] | select(.id == "urbanisme-${TARGET_ENV}")' routes.yaml"
	if [ -z "${path}" ]; then
		echo "update gateway routes..."
		sed "s/TARGET_ENV/${TARGET_ENV}/g" config/gateway_routes.json > config/gateway_routes_"${TARGET_ENV}".json
		
		content="cat config/gateway_routes_${TARGET_ENV}.json | tr -d '\r\n'"
		echo "prepare to add to gateway: ${content}"
		yqexp=".spring.cloud.gateway.routes += ${content}"
		yq e -i "${yqexp}" routes.yaml
	
		echo "copy back to pod of file /etc/georchestra/gateway/routes.yaml ..."
		kubectl cp routes.yaml "${POD_NAME}":/etc/georchestra/gateway/routes.yaml
		echo "copy back to pod of file /etc/georchestra/gateway/routes.yaml done."
	else 
		echo "nothing to update"
	fi
fi


# forcer le rédémarrage
if [ -n "${FORCE_PODS}" ]; then
	kubectl delete pod -l app=urbanisme-back-"${TARGET_ENV}" ;
fi
