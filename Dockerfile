# Base image
FROM artifact.it.att.com/docker-hub/mongo:latest

# RUN sh -c "echo 'deb https://artifact.it.att.com/artifactory/att-deb-public-group focal main' >> /etc/apt/sources.list"
# Install system packages
# RUN apt -o Acquire::http::Timeout=300 update && apt -o Acquire::http::Timeout=300 upgrade -y  
# RUN apt -o Acquire::http::Timeout=300 install -y less htop nano jq curl pv
RUN rm -rf /etc/apt/sources.list.d/mongodb-org.list
RUN apt -o Acquire::https::Proxy=proxy.conexus.svc.local:3128 update
RUN apt -o Acquire::https::Proxy=proxy.conexus.svc.local:3128 install curl pv jq nano less -y
# Deploy mongodb-database-tools
# RUN curl -k -O https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2404-x86_64-100.12.2.tgz -o /mongodb-database-tools-ubuntu2404-x86_64-100.12.2.tgz 
COPY ./mongoimport /usr/local/bin/
COPY ./mongoexport /usr/local/bin/
# WORKDIR /opt
# RUN mv /mongodb-database-tools-ubuntu2404-x86_64-100.12.2.tgz /opt/
# RUN tar -xvf /opt/mongodb-database-tools-ubuntu2404-x86_64-100.12.2.tgz
# RUN cp /opt/mongodb-database-tools-ubuntu2404-x86_64-100.12.2/bin/* /usr/local/bin/
 
# Create workdir
RUN mkdir -p /opt/vnc
WORKDIR /opt/vnc
# COPY mongodb/scripts/* /opt/vnc/
# RUN chmod +x *.sh
 
 