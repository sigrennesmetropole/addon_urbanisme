FROM jetty:9.3-jre8
USER root

ADD urbanisme.war /var/lib/jetty/webapps/urbanisme.war
ADD etc/ /etc

ENV PROPERTIES_PATH /etc/georchestra/urbanisme/urbanisme.properties

RUN mkdir -p /opt/urbanisme
ADD entrypoint.sh /opt/urbanisme/entrypoint.sh
ENTRYPOINT [ "/bin/bash", "/opt/urbanisme/entrypoint.sh" ]

CMD [ "sh", "-c", "exec java -Djava.io.tmpdir=/tmp/jetty \
      ${ADD_JAVA_OPTS}                                   \
      -Xmx${XMX:-1G} -Xms${XMX:-1G}                      \
      -jar /usr/local/jetty/start.jar" ]
