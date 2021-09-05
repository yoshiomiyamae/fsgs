<!--
This README is based on Best-README-Template
https://github.com/othneildrew/Best-README-Template
-->
<!--
*** Thanks for checking out the fsgs. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]



<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/yoshiomiyamae/fsgs">
    <!-- <img src="docs/images/logo.png" alt="Logo" width="80" height="80"> -->
  </a>

  <h3 align="center">FSGS</h3>

  <p align="center">
    An awesome README template to jumpstart your projects!
    <br />
    <a href="https://github.com/yoshiomiyamae/fsgs/docs"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <!-- <a href="https://github.com/yoshiomiyamae/fsgs">View Demo</a>
    · -->
    <a href="https://github.com/yoshiomiyamae/fsgs/issues">Report Bug</a>
    ·
    <a href="https://github.com/yoshiomiyamae/fsgs/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

![Product Name Screen Shot][product-screenshot]

The original KiriKiri2 / KAG3 was a famous adventure game engine in Japan.
The project had been closed, and no longer mantained.
The successor project [KiriKiriZ](https://github.com/krkrz/krkrz) is live, but seems not mantained recently, and also it seems to be only for Japanese developer.
Therefore, I have been creating this game engine from scratch.

* Run on electron framework. It means your game will run on multiple-platforms.
* Aiming to keep compatibility with KAG3.
  * KiriKiri2 had a script interpleter named TJS. This project doesn't implement TJS, but uses Typescript for that purpose.
* MIT License. You can add your own code to this.
  * But I would love you to pull-request, so that this original engine will be enriched.

### Built With
* [Electron](https://www.electronjs.org/)
* [React](https://reactjs.org/)
* [Typescript](https://www.typescriptlang.org/)


<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

* [yarn](https://classic.yarnpkg.com/en/docs/install)

### Installation
```sh
git clone git@github.com:yoshiomiyamae/fsgs.git
yarn
```

<!-- USAGE EXAMPLES -->
## Usage

1. Put your game data into `data` directory. As default, there is a sample data.
1. The entry point is `data/scenario/first.ks`. Modify the file first to implement your game.
1. Test Run
```sh
yarn start
```
4. To compile your game to distribute, use these commands.
```sh
yarn build:win    # For Windows
yanr build:linux  # For Linux
```

_For more examples, please refer to the [Documentation](docs/index.md)_



<!-- ROADMAP -->
## Roadmap

See the [Milestone for v1.0.0](https://github.com/yoshiomiyamae/fsgs/milestone/1) for a list of proposed features (and known issues).


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


<!-- LICENSE -->
## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.


<!-- CONTACT -->
## Contact

[Yoshio Miyamae](https://github.com/yoshiomiyamae)

Project Link: [FSGS](https://github.com/yoshiomiyamae/fsgs)



<!-- ACKNOWLEDGEMENTS -->



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/yoshiomiyamae/fsgs.svg?style=for-the-badge
[contributors-url]: https://github.com/yoshiomiyamae/fsgs/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/yoshiomiyamae/fsgs.svg?style=for-the-badge
[forks-url]: https://github.com/yoshiomiyamae/fsgs/network/members
[stars-shield]: https://img.shields.io/github/stars/yoshiomiyamae/fsgs.svg?style=for-the-badge
[stars-url]: https://github.com/yoshiomiyamae/fsgs/stargazers
[issues-shield]: https://img.shields.io/github/issues/yoshiomiyamae/fsgs.svg?style=for-the-badge
[issues-url]: https://github.com/yoshiomiyamae/fsgs/issues
[license-shield]: https://img.shields.io/github/license/yoshiomiyamae/fsgs.svg?style=for-the-badge
[license-url]: https://github.com/yoshiomiyamae/fsgs/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[product-screenshot]: docs/images/screenshot.png