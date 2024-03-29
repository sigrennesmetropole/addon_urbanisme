  
# ansible-command

## Prérequis pour installer

- Ansible 2.10
- Ansible galaxy

### SSH

L' utilisateur de déploiement, *ansible*, a accès en SSH aux vms de l'inventory.ini avec les clés privées, encodées en base64 présentes dans les variables de GitlabCI sous les noms :

*ansible_private_key*

cette clé a été générée via *ssh-keygen -t rsa -b 4096 -f nom_de_ma_clé*

La clé publique est ensuite copiée, à la main, ou via ssh-copy-id vers les différents environnements, ici dans le fichier ***/root/.ssh/authorized_keys***

Pour enregistrer les clés privées en base64 il faut utiliser la commande suivante :

`cat ma_clé_privée | base64 -w0` et en copier l'output dans les variables de Gitlab-CI.

La variable est ensuite utilisée via ***ssh-agent*** dans le fichier .gitlab-ci.yml dans la partie ***.deploy-with-ansible***

```
    before_script:
	    - eval $(ssh-agent -s)
	    - ssh-add <(echo "$ansible_public_key_private_open" | base64 -d)
```
  

Pour une utilisation en local, les mêmes étapes pourront être suivies, il faudra charger la clé privée encodée en base64 dans des une variable d'environnement par exemple et d'adapter la partie ssh-add.

  