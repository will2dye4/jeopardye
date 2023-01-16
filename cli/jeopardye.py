#!/usr/bin/env python3

from enum import Enum
from typing import List, Tuple
import argparse
import json
import os
import os.path
import subprocess
import sys
import time


JEOPARDYE_GIT_HOME = os.getenv('JEOPARDYE_GIT_HOME', '/Users/jeopardye/dev/git/jeopardye')
JEOPARDYE_HTML_ROOT = os.getenv('JEOPARDYE_HTML_ROOT', '/opt/homebrew/var/www/jeopardye.com/html')
JEOPARDYE_LOG_FILE = os.getenv('JEOPARDYE_LOG_FILE', '/var/log/jeopardye/server.log')


DEPLOY_COMMAND_USAGE = 'deploy (app|server|both)'
FETCH_COMMAND_USAGE = 'fetch'
LOGS_COMMAND_USAGE = 'logs'
SERVER_COMMAND_USAGE = 'server start|stop|restart|pid'
VERSION_COMMAND_USAGE = 'version'

COMMAND_HELP = f'''
Command to run: {DEPLOY_COMMAND_USAGE}, {FETCH_COMMAND_USAGE}, {LOGS_COMMAND_USAGE}, {SERVER_COMMAND_USAGE}, 
or {VERSION_COMMAND_USAGE}
'''


class Command(Enum):
    DEPLOY_APP = 'deploy app'
    DEPLOY_BOTH = 'deploy both'
    DEPLOY_SERVER = 'deploy server'
    FETCH = 'fetch'
    LOGS = 'logs'
    SERVER_PID = 'API server PID'
    SERVER_RESTART = 'restart API server'
    SERVER_START = 'start API server'
    SERVER_STOP = 'stop API server'
    VERSION = 'version'


DEPLOY_COMMAND_TYPES = {
    'app': Command.DEPLOY_APP,
    'both': Command.DEPLOY_BOTH,
    'server': Command.DEPLOY_SERVER,
}

SERVER_COMMAND_TYPES = {
    'pid': Command.SERVER_PID,
    'restart': Command.SERVER_RESTART,
    'start': Command.SERVER_START,
    'stop': Command.SERVER_STOP,
}


class UsageError(ValueError):
    pass


def bold(text: str) -> str:
    return colorize(text, '1')


def cyan(text: str) -> str:
    return colorize(text, '1;36')


def green(text: str) -> str:
    return colorize(text, '1;32')


def red(text: str) -> str:
    return colorize(text, '1;31')


def colorize(text: str, color: str) -> str:
    return f'\033[{color}m{text}\033[0m'


class JeopardyeMain:

    def __init__(self) -> None:
        parsed_args = self.parse_args(sys.argv[1:])
        self.command = self.parse_command(parsed_args.command)
        self.skip_version_check = parsed_args.skip_version_check

    @staticmethod
    def parse_args(args: List[str]) -> argparse.Namespace:
        parser = argparse.ArgumentParser(description='CLI for administering the Jeopardye game server.')
        parser.add_argument('command', nargs='+', help=COMMAND_HELP)
        parser.add_argument('--skip-version-check', action='store_true',
                            help='Skip checking for a new version before deploying')
        return parser.parse_args(args)

    @staticmethod
    def parse_command(commands: List[str]) -> Command:
        command = commands[0].lower().strip()
        try:
            if command == 'deploy':
                if len(commands) == 1:
                    deploy_target = 'both'
                elif len(commands) == 2:
                    deploy_target = commands[1]
                    if deploy_target not in DEPLOY_COMMAND_TYPES.keys():
                        raise UsageError(DEPLOY_COMMAND_USAGE)
                else:
                    raise UsageError(DEPLOY_COMMAND_USAGE)
                return DEPLOY_COMMAND_TYPES[deploy_target]
            elif command == 'fetch':
                if len(commands) > 1:
                    raise UsageError(FETCH_COMMAND_USAGE)
                return Command.FETCH
            elif command == 'logs':
                if len(commands) > 1:
                    raise UsageError(LOGS_COMMAND_USAGE)
                return Command.LOGS
            elif command == 'server':
                if len(commands) == 2:
                    subcommand = commands[1]
                    if subcommand not in SERVER_COMMAND_TYPES.keys():
                        raise UsageError(SERVER_COMMAND_USAGE)
                else:
                    raise UsageError(SERVER_COMMAND_USAGE)
                return SERVER_COMMAND_TYPES[subcommand]
            elif command == 'version':
                if len(commands) > 1:
                    raise UsageError(VERSION_COMMAND_USAGE)
                return Command.VERSION
            else:
                raise UsageError('deploy|logs|server|version (subcommands)')
        except UsageError as e:
            print(red(f'Usage: {sys.argv[0]} {e.args[0]}'))
            sys.exit(1)

    @staticmethod
    def get_version_number() -> str:
        with open(os.path.join(JEOPARDYE_GIT_HOME, 'package.json')) as f:
            package_json = json.load(f)
        return package_json['version']

    @classmethod
    def fetch_changes(cls) -> Tuple[str, str]:
        starting_version = cls.get_version_number()
        subprocess.run(['git', 'pull', 'origin', 'master'], check=True, cwd=JEOPARDYE_GIT_HOME)
        new_version = cls.get_version_number()
        return starting_version, new_version

    @classmethod
    def fetch_and_print(cls) -> None:
        print(cyan('Fetching the latest version of Jeopardye from GitHub.'))
        starting_version, new_version = cls.fetch_changes()
        print(green(f'\nFetched successfully ({starting_version} --> {new_version}).'))

    @staticmethod
    def populate_index_html_template_values() -> None:
        index_html_path = os.path.join(JEOPARDYE_GIT_HOME, 'build', 'index.html')
        with open(index_html_path) as f:
            content = f.read()

        content = content.replace('{{FS_ORG_ID}}', os.getenv('REACT_APP_FS_ORG'))

        with open(index_html_path, 'w') as f:
            f.write(content)

    def deploy_app(self) -> bool:
        print(cyan('Preparing to fetch and deploy the latest version of the Jeopardye webapp.'))

        print(bold('\nFetching from GitHub...'))
        starting_version, new_version = self.fetch_changes()
        if new_version == starting_version and not self.skip_version_check:
            print(cyan(f'\nNo new changes to deploy (at version {new_version}).'))
            return False
        print(cyan(f'\nDeploying new changes ({starting_version} --> {new_version}).'))

        print(bold('\nInstalling new dependencies...'))
        subprocess.run(['yarn', 'install'], check=True, cwd=JEOPARDYE_GIT_HOME)

        print(bold('\nBuilding production assets...'))
        subprocess.run(['yarn', 'build'], check=True, cwd=JEOPARDYE_GIT_HOME)

        print(bold('\nPopulating template values in index.html...'))
        self.populate_index_html_template_values()

        print(bold('\nCopying assets to Jeopardye HTML root...'))
        subprocess.run(f'cp -r build/* {JEOPARDYE_HTML_ROOT}', check=True, cwd=JEOPARDYE_GIT_HOME, shell=True)

        print(green(f'\nSuccessfully built and deployed version {new_version} of the Jeopardye webapp.'))
        return True

    def deploy_server(self, is_new_version: bool = False) -> None:
        print(cyan('Preparing to fetch and deploy the latest version of the Jeopardye server.'))

        if is_new_version:
            new_version = self.get_version_number()
            print(cyan(f'\nDeploying version {new_version}.'))
        else:
            print(bold('\nFetching from GitHub...'))
            starting_version, new_version = self.fetch_changes()
            if new_version == starting_version and not self.skip_version_check:
                print(cyan(f'\nNo new changes to deploy (at version {new_version}).'))
                return
            print(cyan(f'\nDeploying new changes ({starting_version} --> {new_version}).'))

        self.restart_server()

        print(green(f'\nSuccessfully deployed version {new_version} of the Jeopardye server.'))

    @staticmethod
    def print_logs() -> None:
        print(bold(f'Server logs (from {JEOPARDYE_LOG_FILE}):\n'))
        try:
            subprocess.run(['tail', '-f', JEOPARDYE_LOG_FILE])
        except KeyboardInterrupt:
            pass

    @classmethod
    def print_version(cls) -> None:
        print(bold(f'Current version of Jeopardye: {cls.get_version_number()}'))

    @staticmethod
    def get_server_pid() -> str:
        process = subprocess.run(r"ps aux | grep 'server\.mjs' | grep 'name=jeopardye' | grep -v grep | awk '{print $2}'",
                                 capture_output=True, shell=True)
        return process.stdout.decode('utf-8').strip()

    @classmethod
    def print_server_pid(cls) -> None:
        pid = cls.get_server_pid()
        if pid:
            print(bold(f'Jeopardye server PID: {pid}'))
        else:
            print(red('The Jeopardye server is not currently running.'))

    @classmethod
    def start_server(cls) -> None:
        print(cyan('Starting the Jeopardye server.'))
        pid = cls.get_server_pid()
        if pid:
            print(cyan(f'The Jeopardye server is already running (PID {pid}).'))
        else:
            subprocess.Popen(f'nohup yarn server >> {JEOPARDYE_LOG_FILE} 2>&1', cwd=JEOPARDYE_GIT_HOME, shell=True)
            time.sleep(1)
            pid = cls.get_server_pid()
            if pid:
                print(green(f'Started the Jeopardye server (PID {pid}).'))
            else:
                print(red('Failed to start the Jeopardye server!'))
                raise RuntimeError()

    @classmethod
    def stop_server(cls) -> None:
        print(cyan('Stopping the Jeopardye server.'))
        pid = cls.get_server_pid()
        if pid:
            print(bold(f'Stopping the server (PID {pid})...'))
            subprocess.run(['kill', '-9', pid], check=True)
            print(green(f'Successfully stopped the Jeopardye server.'))
        else:
            print(cyan('The Jeopardye server is not currently running.'))

    @classmethod
    def restart_server(cls) -> None:
        cls.stop_server()
        cls.start_server()

    def run(self) -> None:
        if self.command == Command.DEPLOY_APP:
            self.deploy_app()
        elif self.command == Command.DEPLOY_BOTH:
            is_new_version = self.deploy_app()
            print()
            self.deploy_server(is_new_version)
        elif self.command == Command.DEPLOY_SERVER:
            self.deploy_server()
        elif self.command == Command.FETCH:
            self.fetch_and_print()
        elif self.command == Command.LOGS:
            self.print_logs()
        elif self.command == Command.SERVER_PID:
            self.print_server_pid()
        elif self.command == Command.SERVER_RESTART:
            self.restart_server()
        elif self.command == Command.SERVER_START:
            self.start_server()
        elif self.command == Command.SERVER_STOP:
            self.stop_server()
        elif self.command == Command.VERSION:
            self.print_version()
        else:
            raise ValueError(f'Unknown command: {self.command}')


if __name__ == '__main__':
    JeopardyeMain().run()
