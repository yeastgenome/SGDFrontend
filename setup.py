import os

from setuptools import setup, find_packages
from pip.download import PipSession
from pip.req import parse_requirements

install_reqs = parse_requirements("requirements.txt", session=PipSession())
requires = [str(ir.req) for ir in install_reqs]

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
