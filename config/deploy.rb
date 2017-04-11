lock '3.4.0'

IS_AWS_ENV = (ENV['AWS_ENV'] == 'true')

set :application, 'SGDFrontend'
set :ssh_options, {:forward_agent => true}

set :repo_url, 'git://github.com/yeastgenome/SGDFrontend.git'
set :branch, ENV['BRANCH'] || $1 if `git branch` =~ /\* (\S+)\s/m
if IS_AWS_ENV
	set :deploy_to, '/data/www/' + fetch(:application)
else
	set :deploy_to, '/data/www/' + fetch(:application)+ '_app'
end

set :user, ask(:user, nil)
set :tmp_dir, "/var/tmp"
set :default_stage, "dev"
set :keep_releases, 5
set :format, :pretty
set :log_level, :debug

namespace :deploy do
  after :finishing, :write_config
  if IS_AWS_ENV
  	after :finishing, :build_aws
  	after :finishing, :restart_aws
  else
  	after :finishing, :verify_symlink
  	after :finishing, :restart
  	after :finishing, :build
  end
end
