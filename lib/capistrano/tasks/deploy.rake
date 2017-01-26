namespace :deploy do
  desc 'Build application'
  task :build do
    on roles(:app), in: :sequence do
      execute "cd #{release_path} && make build-deploy"
    end
  end

  desc 'Build AWS env application'
  task :build_aws do
    on roles(:app), in: :sequence do
      execute "export WORKON_HOME=/data/envs/ && source virtualenvwrapper.sh && cd #{release_path} && workon sgdf && make build-deploy"
    end
  end
  
  desc 'Restart Apache'
  task :restart do
    on roles(:app), in: :sequence do
      execute "sudo /usr/sbin/apachectl graceful"
    end
  end

  desc 'Restart AWS'
  task :restart_aws do
    on roles(:app), in: :sequence do
      execute "cd #{current_path} && export WORKON_HOME=/data/envs/ && source virtualenvwrapper.sh && workon sgdf && make stop-prod && make run-prod"
    end
  end

  desc 'Write config file'
  task :write_config do
    on roles(:app), in: :sequence do
      config_file_content = ""
      ["HERITAGE_URL", "BACKEND_URL", "SECRET_KEY", "SENDER", "AUTHOR_RESPONSE_FILE", "COMPUTE_URL", "LOG_DIRECTORY", "ELASTICSEARCH_ADDRESS"].each do |key|
        config_file_content += "#{key.downcase} = '#{ENV[key]}'\n"
      end
      config_file_content += "log_directory = None\n"

      execute "echo \"#{config_file_content}\" >> #{current_path}/src/sgd/frontend/config.py && rm #{current_path}/src/sgd/frontend/config.py.template"
    end
  end

  desc 'Creates symbolic link'
  task :verify_symlink do
    on roles(:app), in: :sequence do
      execute "cd #{current_path}/../../ && echo \"Creating symlink...\"  && rm -rf SGDFrontend && ln -s SGDFrontend_app/current SGDFrontend"
    end
  end
end
