import {
	EventHandler,
	github,
	slack,
	state,
	subscription,
} from "@atomist/skill";

import { Configuration } from "./configuration";

export const onSchedule: EventHandler<
	subscription.types.OnScheduleSubscription,
	Configuration
> = async ctx => {
	const channels = ctx.configuration.parameters.channels.map(
		c => c.channelName,
	);
	const repositories = ctx.configuration.parameters.repositories.map(r => {
		const parts = r.split("/");
		return {
			owner: parts[0],
			repo: parts[1],
		};
	});
	const token = ctx.configuration.parameters.token;
	const knownReleases = await state.hydrate<Record<string, string>>(
		ctx.configuration.name,
		ctx,
		{},
	);

	const api = github.api(
		token ? { credential: { token, scopes: [] } } : undefined,
	);

	for (const repository of repositories) {
		const slug = `${repository.owner}/${repository.repo}`;
		const release = (
			await api.repos.listReleases({
				owner: repository.owner,
				repo: repository.repo,
			})
		).data.filter(r => !r.draft)[0];
		if (knownReleases[slug] !== release.name) {
			knownReleases[slug] = release.name;

			let avatar;
			try {
				avatar = (
					await api.orgs.get({
						org: repository.owner,
					})
				).data.avatar_url;
			} catch (e) {
				avatar = (
					await api.users.getByUsername({
						username: repository.owner,
					})
				).data.avatar_url;
			}

			const response = await ctx.http.request(avatar, { method: "GET" });
			const mimeType = response.headers.get("content-type");

			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const getColors = require("get-image-colors");
			const colors = (
				await getColors(await response.buffer(), mimeType)
			).map((c: any) => c.hex());

			const message = slack.infoMessage(
				release.name,
				slack.githubToSlack(release.body),
				ctx,
				{
					author_link: release.html_url,
					author_icon: avatar,
					color: colors[0],
					footer: slack.url(release.html_url, slug),
					footer_icon:
						"https://images.atomist.com/rug/github_grey.png",
					ts: Math.floor(Date.parse(release.created_at) / 1000),
				},
			);
			message.text = `${slack.url(
				release.author.html_url,
				`@${release.author.login}`,
			)} created new release in ${slack.url(release.html_url, slug)}`;
			await ctx.message.send(message, { channels });
		}
	}

	await state.save(knownReleases, ctx.configuration.name, ctx);
};
