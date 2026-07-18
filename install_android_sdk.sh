#!/bin/bash
set -e
echo "Downloading Android SDK..."
mkdir -p /opt/android-sdk/cmdline-tools
wget -q https://dl.google.com/android/repository/commandlinetools-linux-10406996_latest.zip -O cmdline-tools.zip
unzip -q cmdline-tools.zip -d /opt/android-sdk/cmdline-tools
mv /opt/android-sdk/cmdline-tools/cmdline-tools /opt/android-sdk/cmdline-tools/latest
rm cmdline-tools.zip

export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

echo "Accepting licenses..."
yes | sdkmanager --licenses >/dev/null

echo "Installing platform tools and build tools..."
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" >/dev/null

echo "SDK Installed!"
