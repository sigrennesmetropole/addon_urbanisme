FROM jetty:9.3-jre8

ADD urbanisme-16.06-SNAPSHOT.war /var/lib/jetty/webapps/urbanisme.war
ADD etc/ /etc

CMD [ "sh", "-c", "exec java -Djava.io.tmpdir=/tmp/jetty \
      ${ADD_JAVA_OPTS}                                   \
      -Xmx${XMX:-1G} -Xms${XMX:-1G}                      \
      -jar /usr/local/jetty/start.jar" ]
