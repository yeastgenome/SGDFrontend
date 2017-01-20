namespace :deploy do
  desc 'Build application'
  task :build do
    on roles(:app), in: :sequence do
      execute "export WORKON_HOME=/data/envs/ && export NODE_ENV=production && source virtualenvwrapper.sh && cd #{current_path} && workon sgd && make prod-build"
    end
  end

  desc 'Write config variables'
  task :config do
    on roles(:app), in: :sequence do
      variables = "'"
      ["NEX2_URI", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_BUCKET", "GOOGLE_CLIENT_ID", "ES_URI"].each do |k|
        variables += "export #{k}=\"#{ENV[k]}\"\n"
      end
      variables += "'"
      execute "echo #{variables} > #{current_path}/prod_variables.sh"
    end
  end

  desc 'Restart pyramid'
  task :restart do
    on roles(:app), in: :sequence do
      execute "cd #{current_path} && export WORKON_HOME=/data/envs/ && source virtualenvwrapper.sh && workon sgd && . prod_variables.sh && make stop-prod && make run-prod && cat /var/run/pyramid/backend.pid"
    end
  end

  desc 'Copy js build'
  task :copy_js do
    on roles(:app), in: :sequence do
      static_build_path = "src/build"
      execute "mkdir -p #{current_path}/#{static_build_path}"
      upload!("./#{static_build_path}", "#{current_path}/#{static_build_path}", { recursive: true })
    end
  end
end
