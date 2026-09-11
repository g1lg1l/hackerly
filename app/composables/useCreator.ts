/** Attribution from app.config; falls back to the GitHub handle until a name is set. */
export function useCreator() {
  const { creator, repo } = useAppConfig()
  const handle = /github\.com\/([^/]+)/.exec(creator.github)?.[1]
  const name = creator.name && creator.name !== 'YOUR NAME' ? creator.name : (handle ?? 'the author')
  return { name, github: creator.github, repo }
}
