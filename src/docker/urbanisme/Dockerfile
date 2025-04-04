FROM jetty:9.4-jdk17-eclipse-temurin

USER root

RUN apt-get update && apt-get upgrade -y
ADD urbanisme.war /var/lib/jetty/webapps/urbanisme.war
RUN mkdir -p /tmp/jetty
RUN chmod 777 -R /tmp && chmod o+t -R /tmp

RUN mkdir -p /etc/georchestra
RUN chmod 777 -R /etc/georchestra

ENV PROPERTIES_PATH /etc/georchestra/urbanisme/urbanisme.properties

RUN mkdir -p /opt/urbanisme
ADD entrypoint.sh /opt/urbanisme/entrypoint.sh
ENTRYPOINT [ "/bin/bash", "/opt/urbanisme/entrypoint.sh" ]

CMD [ "sh", "-c", "exec java -Djava.io.tmpdir=/tmp/jetty \
      ${ADD_JAVA_OPTS}                                   \
      -Xmx${XMX:-1G} -Xms${XMX:-1G}                      \
      -jar /usr/local/jetty/start.jar" ]
