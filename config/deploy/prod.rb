set :stage, :prod

server ENV['SERVER_1'],
user: fetch(:user),
roles: %w{web app},
ssh_options: {
	user: fetch(:user), # overrides user setting above
	keys: %w(~/.ssh/id_rsa),
	forward_agent: true,
	auth_methods: %w(publickey password)
	# password: 'please use keys'
}

server ENV['SERVER_2'],
user: fetch(:user),
roles: %w{web app},
ssh_options: {
	user: fetch(:user), # overrides user setting above
	keys: %w(~/.ssh/id_rsa),
	forward_agent: true,
	auth_methods: %w(publickey password)
	# password: 'please use keys'
}
