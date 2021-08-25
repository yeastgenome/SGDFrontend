import os

import pip
from setuptools import setup, find_packages
# from pip._internal.download import PipSession
# from pip._internal.req import parse_requirements
try:
    from pip.req import parse_requirements
except ImportError:
    from pip._internal.req import parse_requirements

# install_reqs = parse_requirements("requirements.txt", session=PipSession()) 
# requires = [str(ir.req) for ir in install_reqs]
install_reqs = parse_requirements("requirements.txt", session=False)

requires = None
try:
    requires = [str(ir.req) for ir in install_reqs]
except:
    requires = [str(ir.requirement) for ir in install_reqs]
    
setup(name='SGDFrontend',
      version='0.0',
      description='SGDFrontend',
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='Kelley Paskov',
      author_email='kpaskov@stanford.edu',
      url='',
      keywords='web pyramid pylons',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      install_requires=requires,
      tests_require=requires,
      test_suite="yeastgenome",
      entry_points="""\
      [paste.app_factory]
      yeastgenome = src:yeastgenome
      """,
      )
