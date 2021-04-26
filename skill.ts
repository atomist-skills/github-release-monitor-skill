/*
 * Copyright © 2021 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
	Category,
	ParameterType,
	ParameterVisibility,
	resourceProvider,
	skill,
} from "@atomist/skill";

import { Configuration } from "./lib/configuration";

export const Skill = skill<Configuration & { schedule: any }>({
	name: "github-release-monitor-skill",
	namespace: "atomist",
	description: "Monitor GitHub repositories for new releases",
	displayName: "GitHub Release Monitor",
	categories: [Category.DevOps],
	iconUrl:
		"https://raw.githubusercontent.com/atomist-skills/github-auto-merge-skill/main/docs/images/icon.svg",

	runtime: {
		memory: 1024,
		timeout: 540,
	},

	resourceProviders: {
		github: resourceProvider.gitHub({ minRequired: 1 }),
		chat: resourceProvider.chat({ minRequired: 1 }),
	},

	parameters: {
		repositories: {
			type: ParameterType.StringArray,
			displayName: "Repositories",
			description:
				"Repositories to monitor for new releases in `<owner>/<repo>` syntax",
			required: true,
			pattern: "^\\S*\\/\\S*$",
		},
		channels: {
			type: ParameterType.ChatChannels,
			displayName: "Channels",
			description: "Chat channels to send release notifications to",
			required: true,
		},
		token: {
			type: ParameterType.Secret,
			displayName: "GitHub Token",
			description: "Personal Access Token to use for checking GitHub API",
			required: false,
			visibility: ParameterVisibility.Advanced,
		},
		schedule: {
			type: ParameterType.Schedule,
			displayName: "Schedule",
			description: "Cron expression to configure when skill should run",
			required: false,
			defaultValue: "0 * * * *",
			visibility: ParameterVisibility.Advanced,
		},
	},

	subscriptions: ["@atomist/skill/onSchedule"],
});
