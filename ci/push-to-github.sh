#!/bin/bash

GITHUB_RM_URL="github.com/sigrennesmetropole/addon_urbanisme.git"

if [ ! -z "$DEBUG" ]; then
set -x
fi

if [ ! -z "$GIT_FORCE" ]; then
FORCE="--force"
fi

echo "Checking variables..."

if [ -z "$SOURCE_REPOSITORY" ]; then
  echo 'Please specify SOURCE_REPOSITORY variable'
  exit 1
fi

# Le dossier source doit obligatoirement finir par un "/" si on souhaite que rsync soit récursif
[[ $SOURCE_REPOSITORY == */ ]] || SOURCE_REPOSITORY+=/

if [ -z "$COMMIT_MESSAGE" ]; then
  echo 'Please specify COMMIT_MESSAGE variable'
  exit 1
fi
echo "COMMIT_MESSAGE=$COMMIT_MESSAGE"

# Please check that you use a GitHub account with appropriate email
if [ -z "$GITHUB_RM_LOGIN" ]; then
  echo 'Please specify GITHUB_RM_LOGIN variable'
  exit 1
fi

# Please check that you use a GitHub account with appropriate username
if [ -z "$GITHUB_RM_ACCOUNT" ]; then
  echo 'Please specify GITHUB_RM_ACCOUNT variable'
  exit 1
fi

# Please check that you use a GitHub token (classic) that has not expired and has "delete:packages, repo, workflow, write:packages" scopes.
if [ -z "$GIT_TOKEN" ]; then
  echo 'Please specify GIT_TOKEN variable'
  exit 1
fi

DESTINATION_REPOSITORY=/tmp/addon_urbanisme/
[ -z "$GIT_REMOTE" ] && GIT_REMOTE="https://$GITHUB_RM_ACCOUNT:$GIT_TOKEN@$GITHUB_RM_URL"
[ -z "$PRODUCTION_REMOTE_BRANCH" ] && PRODUCTION_REMOTE_BRANCH="master"
TEMP_DIRECTORY=/tmp

echo "Cloning from https://$GITHUB_RM_URL to destination repository : $DESTINATION_REPOSITORY/..."
git clone "$GIT_REMOTE" "$DESTINATION_REPOSITORY/"

echo "Checkout of remote branch $PRODUCTION_REMOTE_BRANCH"
cd "$DESTINATION_REPOSITORY/"
git checkout "$PRODUCTION_REMOTE_BRANCH"
cd -

echo "Syncing source $SOURCE_REPOSITORY to target $DESTINATION_REPOSITORY/..."

# Backup .git (git back Jojo !) directory from destination (deleted by "--delete-excluded")
cp -r $DESTINATION_REPOSITORY/.git /builds/rennes-metropole/tabou2/.git.back
mv $DESTINATION_REPOSITORY/.git $TEMP_DIRECTORY/.git.back

if [ ! -z "$DEBUG" ]; then
ls -a $DESTINATION_REPOSITORY/.git
ls -a $TEMP_DIRECTORY/.git.back
fi

rsync \
  --archive \
  --exclude-from="$SOURCE_REPOSITORY/.gitignore" \
  --filter="merge push-to-github-filter.txt" \
  --delete-excluded \
  --delete-during \
  --verbose \
  "$SOURCE_REPOSITORY" "$DESTINATION_REPOSITORY/"

# Restore .git directory to destination
if [ ! -z "$DEBUG" ]; then
ls -al $TEMP_DIRECTORY/.git.back
ls -al /builds/rennes-metropole/tabou2/.git.back
fi

mv $TEMP_DIRECTORY/.git.back/* $DESTINATION_REPOSITORY/.git

if [ ! -z "$DEBUG" ]; then
ls -al $DESTINATION_REPOSITORY/.git
fi

# Commit and push
cd "$DESTINATION_REPOSITORY"
echo "Committing and pushing to https://$GITHUB_RM_URL..."

git config user.name "$GITHUB_RM_ACCOUNT"
git config user.email "$GITHUB_RM_LOGIN"
git add --all
git commit --message "$COMMIT_MESSAGE"
git push $FORCE "$GIT_REMOTE"

echo "Done."
