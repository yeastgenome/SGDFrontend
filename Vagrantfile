# -*- mode: ruby -*-
# vi: set ft=ruby :

# All Vagrant configuration is done below. The "2" in Vagrant.configure
# configures the configuration version (we support older styles for
# backwards compatibility). Please don't change it unless you know what
# you're doing.
Vagrant.configure("2") do |config|
  # The most common configuration options are documented and commented below.
  # For a complete reference, please see the online documentation at
  # https://docs.vagrantup.com.

  # Every Vagrant development environment requires a box. You can search for
  # boxes at https://vagrantcloud.com/search.
  # config.vm.box = "base"

  # Disable automatic box update checking. If you disable this, then
  # boxes will only be checked for updates when the user runs
  # `vagrant box outdated`. This is not recommended.
  # config.vm.box_check_update = false

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:8080" will access port 80 on the guest machine.
  # NOTE: This will enable public access to the opened port
  # config.vm.network "forwarded_port", guest: 80, host: 8080

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine and only allow access
  # via 127.0.0.1 to disable public access
  config.vm.network "forwarded_port", guest: 22, host: 2222, disabled: true
  config.vm.network "forwarded_port", guest: 22, host: 2200, id: "ssh", host_ip: "0.0.0.0"

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  # config.vm.network "private_network", ip: "192.168.33.10"

  # Create a public network, which generally matched to bridged network.
  # Bridged networks make the machine appear as another physical device on
  # your network.
  # config.vm.network "public_network"

  # Share an additional folder to the guest VM. The first argument is
  # the path on the host to the actual folder. The second argument is
  # the path on the guest to mount the folder. And the optional third
  # argument is a set of non-required options.

  config.vm.synced_folder ".", "/frontend", docker_consistency: "cached"

  # Provider-specific configuration so you can fine-tune various
  # backing providers for Vagrant. These expose provider-specific options.
  # Example for VirtualBox:
  #
  # config.vm.ssh.keep_alive = true

  config.vm.provider "docker" do |docker, override|
    override.vm.box = nil
    # build_dir is the directory to build the docker image with when vagrant brings
    # the container up: https://www.vagrantup.com/docs/providers/docker/configuration#build_dir
    docker.build_dir = "."
    # docker.name must be unique for a host but need not match the Dockerfile
    docker.name = "frontend"
    # remains_running tells vagrant that after bringing up the container it ought to
    # continue running, and if it halts quickly it is an error
    docker.remains_running = true
    # has_ssh `true` turns on SSH
    docker.has_ssh = true
    # any other extra `docker run` args. These options are from: https://github.com/dholth/vagrant-docker/blob/master/Vagrantfile#L15
    docker.create_args = ['--tmpfs', '/tmp:exec', '-v', '/sys/fs/cgroup:/sys/fs/cgroup:ro']
    
    # override default CMD with docker.cmd = ["tail", "-f", "/def/null"]

    # map ports like "host:guest". The Dockerfile runs the front end on 6545 by default.
    # To map this to the host machine, use the ports option like this. Here we map 6546
    # to 6545 in order to not collide with other front end instances
    docker.ports = ["6546:6545"]
  end

  #
  # View the documentation for the provider you are using for more
  # information on available options.

  # Enable provisioning with a shell script. Additional provisioners such as
  # Ansible, Chef, Docker, Puppet and Salt are also available. Please see the
  # documentation for more information about their specific syntax and use.
  # config.vm.provision "shell", inline: <<-SHELL
  #   apt-get update
  #   apt-get install -y apache2
  # SHELL
end
