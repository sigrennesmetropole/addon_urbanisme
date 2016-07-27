FROM georchestra/mapfishapp

ADD urbanisme-16.06-SNAPSHOT-addon.zip /etc/georchestra/mapfishapp/addons/
RUN cd /etc/georchestra/mapfishapp/addons &&      \
    unzip urbanisme-16.06-SNAPSHOT-addon.zip &&   \
    rm urbanisme-16.06-SNAPSHOT-addon.zip

