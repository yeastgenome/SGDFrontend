set :stage, :prod

server 'server',
user: 'user',
roles: %w{web app},
ssh_options: {
	user: 'user', # overrides user setting above
	keys: %w(/home/user/.ssh/id_rsa),
	forward_agent: true,
	auth_methods: %w(publickey password)
	# password: 'please use keys'
}

server 'server',
user: 'user',
roles: %w{web app},
ssh_options: {
	user: 'user', # overrides user setting above
	keys: %w(/home/user/.ssh/id_rsa),
	forward_agent: true,
	auth_methods: %w(publickey password)
	# password: 'please use keys'
}
