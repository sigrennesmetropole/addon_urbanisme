FROM jetty:9.3-jre8
#FROM jetty:9.4.31-jdk11
USER root
MAINTAINER fni18300@open-groupe.com
ENV TZ=Europe/Paris
EXPOSE {{addon_urbanisme_server_port}}

# Jetty supplies Mail but not the activation dependency,
# if you use JavaMail it uses Jetty's JavaMail
# which then fails on Java >= 9 (even if we supply the
# activation dependency in Maven, as Jetty's JavaMail
# uses Jetty's classloader rather than ours)
#RUN rm -r /usr/local/jetty/lib/mail

ADD addon_urbanisme.war /var/lib/jetty/webapps/urbanisme.war

CMD [ "sh", "-c", "exec java -Djava.io.tmpdir=/tmp/jetty -Dgeorchestra.datadir=/etc/georchestra \
      ${ADD_JAVA_OPTS}                                   \
      -Xmx${XMX:-1G} -Xms${XMX:-1G}                      \
      -jar /usr/local/jetty/start.jar" ]
